import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {

    var webView: WKWebView!
    var studentName = "Unknown iOS Student"
    var studentId = ""
    var clientSessionToken = ""
    var courseId = ""
    var quizId = ""

    var quizUrl = "https://lms.youruniversity.edu/lms.html"
    var backendUrl = "https://quiz-api.youruniversity.edu"
    var reportingUrl = ""
    var heartbeatUrl = ""
    var allowedDomains = ["lms.youruniversity.edu", "quiz-api.youruniversity.edu"]

    private var heartbeatTimer: Timer?
    private var pendingLaunchURL: URL?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupLifecycleObservers()
        setupCaptureDetection()
        setupGuidedAccessListener()
        checkSecurityAndStart()
    }

    func handleIncomingURL(_ url: URL) {
        if webView == nil {
            pendingLaunchURL = url
            return
        }

        guard url.scheme == "anticheat" else { return }

        if let incomingBackendURL = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == "backendUrl" })?
            .value?
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !incomingBackendURL.isEmpty {
            backendUrl = incomingBackendURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        }

        switch url.host ?? "" {
        case "launch":
            if let ticket = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?
                .first(where: { $0.name == "ticket" })?
                .value?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               !ticket.isEmpty {
                redeemLaunchTicket(ticket)
            }
        case "open":
            loadProtectedURL()
            startHeartbeat()
        default:
            let finalUrlString = url.absoluteString.replacingOccurrences(of: "anticheat://", with: "https://")
            if let finalUrl = URL(string: finalUrlString) {
                quizUrl = finalUrl.absoluteString
                loadProtectedURL()
                startHeartbeat()
            }
        }
    }

    private func setupLifecycleObservers() {
        NotificationCenter.default.addObserver(self, selector: #selector(appWillResignActive), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(appDidEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    @objc private func appWillResignActive() {
        reportToLMS(event: "violation_focus_lost", detail: "Student left the anti-cheat app")
    }

    @objc private func appDidEnterBackground() {
        reportToLMS(event: "violation_app_minimized", detail: "Student sent the anti-cheat app to the background")
    }

    func checkSecurityAndStart() {
        if !UIAccessibility.isGuidedAccessEnabled {
            showSecurityWarning("SECURITY REQUIRED: Please triple-click the side button and enable Guided Access to start.")
            return
        }
        setupSecureWebView()
        if let launchURL = pendingLaunchURL {
            self.pendingLaunchURL = nil
            handleIncomingURL(launchURL)
        } else {
            loadProtectedURL()
            startHeartbeat()
        }
    }

    func setupSecureWebView() {
        let field = UITextField()
        field.isSecureTextEntry = true
        field.isHidden = true
        view.addSubview(field)

        if let secureLayer = findSecureLayer(in: field.layer) {
            let frame = view.bounds
            webView = WKWebView(frame: frame)
            webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            webView.navigationDelegate = self
            webView.customUserAgent = "AntiCheatBrowser/1.0 (UniversityExam; iOS)"
            secureLayer.addSublayer(webView.layer)
            view.addSubview(webView)
            webView.isUserInteractionEnabled = true
        } else {
            setupStandardWebView()
        }
    }

    private func setupStandardWebView() {
        webView = WKWebView(frame: view.bounds)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.customUserAgent = "AntiCheatBrowser/1.0 (UniversityExam; iOS)"
        view.addSubview(webView)
    }

    private func findSecureLayer(in layer: CALayer) -> CALayer? {
        if layer.name == "CanvasView" || layer.description.contains("CanvasView") || layer.description.contains("Secure") {
            return layer
        }
        for sublayer in layer.sublayers ?? [] {
            if let match = findSecureLayer(in: sublayer) {
                return match
            }
        }
        return nil
    }

    private func buildProtectedRequest(urlString: String) -> URLRequest? {
        guard let url = URL(string: urlString) else { return nil }
        var request = URLRequest(url: url)
        if !clientSessionToken.isEmpty {
            request.addValue(clientSessionToken, forHTTPHeaderField: "X-Protected-Client-Session")
            request.addValue("Bearer \(clientSessionToken)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func loadProtectedURL() {
        guard let request = buildProtectedRequest(urlString: quizUrl) else { return }
        webView.load(request)
    }

    private func redeemLaunchTicket(_ ticket: String) {
        guard let url = URL(string: "\(backendUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/")))/api/protected-client/redeem-launch") else {
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["ticket": ticket])

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard error == nil,
                  let response = response as? HTTPURLResponse,
                  (200...299).contains(response.statusCode),
                  let data = data,
                  let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                DispatchQueue.main.async { self.loadProtectedURL() }
                return
            }

            self.clientSessionToken = String(describing: payload["clientSessionToken"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            self.heartbeatUrl = String(describing: payload["heartbeatUrl"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            self.reportingUrl = String(describing: payload["reportingUrl"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let sessionUrl = String(describing: payload["quizSessionUrl"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if !sessionUrl.isEmpty { self.quizUrl = sessionUrl }

            if let quiz = payload["quiz"] as? [String: Any] {
                self.courseId = String(describing: quiz["courseId"] ?? quiz["groupKey"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                self.quizId = String(describing: quiz["id"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            }

            if let identity = payload["studentIdentity"] as? [String: Any] {
                self.studentId = String(describing: identity["id"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                let name = String(describing: identity["name"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                if !name.isEmpty { self.studentName = name }
            }

            if let domains = payload["allowedDomains"] as? [String], !domains.isEmpty {
                #if DEBUG
                self.allowedDomains = Array(Set(domains + ["127.0.0.1", "localhost"]))
                #else
                self.allowedDomains = Array(Set(domains))
                #endif
            }

            DispatchQueue.main.async {
                self.loadProtectedURL()
                self.startHeartbeat()
            }
        }.resume()
    }

    func setupCaptureDetection() {
        if #available(iOS 17.0, *) {
            registerForTraitChanges([UITraitSceneCaptureState.self]) { (self: ViewController, _) in
                if self.view.traitCollection.sceneCaptureState == .active {
                    self.reportToLMS(event: "violation_screen_recording", detail: "Active scene capture detected")
                    self.webView?.isHidden = true
                    self.showSecurityWarning("SCREEN RECORDING DETECTED: Content Hidden.")
                } else {
                    self.webView?.isHidden = false
                }
            }
        } else {
            NotificationCenter.default.addObserver(forName: UIScreen.capturedDidChangeNotification, object: nil, queue: .main) { _ in
                if UIScreen.main.isCaptured {
                    self.reportToLMS(event: "violation_screen_recording", detail: "Screen capture detected")
                    self.webView?.isHidden = true
                } else {
                    self.webView?.isHidden = false
                }
            }
        }

        NotificationCenter.default.addObserver(forName: UIApplication.userDidTakeScreenshotNotification, object: nil, queue: .main) { _ in
            self.reportToLMS(event: "critical_violation", detail: "Screenshot detected")
            self.showSecurityWarning("VIOLATION: Screenshots are strictly prohibited.")
        }
    }

    func setupGuidedAccessListener() {
        NotificationCenter.default.addObserver(forName: UIAccessibility.guidedAccessStatusDidChangeNotification, object: nil, queue: .main) { _ in
            if !UIAccessibility.isGuidedAccessEnabled {
                self.reportToLMS(event: "critical_violation", detail: "Guided Access was disabled")
                self.webView?.isHidden = true
                self.showSecurityWarning("EXAM TERMINATED: You must stay in Guided Access.")
            }
        }
    }

    func showSecurityWarning(_ message: String) {
        let alert = UIAlertController(title: "Security Violation", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    func startHeartbeat() {
        if heartbeatTimer != nil { return }
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            self.reportToLMS(event: "heartbeat", detail: "Active")
        }
    }

    func reportToLMS(event: String, detail: String) {
        let target = (event == "heartbeat" && !heartbeatUrl.isEmpty) ? heartbeatUrl : reportingUrl
        guard !target.isEmpty, let url = URL(string: target) else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        if !clientSessionToken.isEmpty {
            request.addValue(clientSessionToken, forHTTPHeaderField: "X-Protected-Client-Session")
            request.addValue("Bearer \(clientSessionToken)", forHTTPHeaderField: "Authorization")
        }

        let payload: [String: Any] = [
            "studentId": studentId,
            "studentName": studentName,
            "courseId": courseId,
            "quizId": quizId,
            "clientSessionToken": clientSessionToken,
            "clientType": "mobile-app",
            "securityLevel": "mobile-limited",
            "event": event,
            "note": detail,
            "status": event == "heartbeat" ? "active" : "",
            "details": [
                "note": detail,
                "platform": "iOS"
            ],
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: request).resume()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let host = url.host else {
            decisionHandler(.allow)
            return
        }
        let isAllowed = allowedDomains.contains { domain in
            host == domain || host.hasSuffix(".\(domain)")
        }
        if isAllowed {
            decisionHandler(.allow)
        } else {
            reportToLMS(event: "security_violation", detail: "Blocked unauthorized site: \(url.absoluteString)")
            decisionHandler(.cancel)
        }
    }
}
