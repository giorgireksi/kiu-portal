(function initCareerMarketPage() {
    'use strict';
    var BP = 1024;
    var CAREER_PROVIDER_SETTINGS_KEY = 'KIU_CAREER_AI_PROVIDER_SETTINGS';
    var CAREER_PROVIDER_API_KEY_SESSION_KEY = 'KIU_CAREER_AI_PROVIDER_API_KEY';
    var CAREER_PROVIDER_INSTRUCTIONS_KEY = 'KIU_CAREER_PROVIDER_INSTRUCTIONS_STUDIO';
    var CAREER_INTAKE_DRAFT_KEY = 'KIU_CAREER_INTAKE_DRAFT';
    var CAREER_REPORTS_KEY = 'KIU_CAREER_REPORTS';
    var CAREER_HISTORY_KEY = 'KIU_CAREER_HISTORY';
    var CAREER_EVIDENCE_KEY = 'KIU_CAREER_EVIDENCE';
    var CAREER_VACANCIES_KEY = 'KIU_CAREER_VACANCIES';
    var PROVIDER_LABELS = {
        'google-gemini': 'Google Gemini',
        'nvidia-nim': 'NVIDIA NIM',
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        openrouter: 'OpenRouter'
    };
    var DEFAULT_MODELS = {
        'google-gemini': 'gemini-2.5-flash-lite',
        'nvidia-nim': 'meta/llama-3.1-70b-instruct',
        openai: 'gpt-5-nano',
        deepseek: 'deepseek-chat',
        openrouter: 'deepseek/deepseek-chat-v3.1'
    };
    var PROVIDER_CONFIGS = {
        'google-gemini': {
            mode: 'Gemini generateContent',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
            auth: 'API key query parameter',
            docs: 'Google Gemini REST'
        },
        'nvidia-nim': {
            mode: 'OpenAI-compatible chat completions',
            endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
            auth: 'Bearer token',
            docs: 'NVIDIA NIM hosted endpoint'
        },
        openai: {
            mode: 'Responses API',
            endpoint: 'https://api.openai.com/v1/responses',
            auth: 'Bearer token',
            docs: 'OpenAI Responses'
        },
        deepseek: {
            mode: 'OpenAI-compatible chat completions',
            endpoint: 'https://api.deepseek.com/chat/completions',
            auth: 'Bearer token',
            docs: 'DeepSeek API'
        },
        openrouter: {
            mode: 'OpenAI-compatible chat completions',
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            auth: 'Bearer token',
            docs: 'OpenRouter API'
        }
    };
    var pendingProviderInstructionFiles = [];
    var careerProviderApiKeyMemory = '';
    var instructionStudioState = {
        provider: 'google-gemini',
        data: {}
    };
    var providerModalBindingsReady = false;
    var instructionsModalBindingsReady = false;
    var toolModalBindingsReady = false;
    var ROLE_BLUEPRINTS = {
        'Computer Science': ['Software Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Data Analyst', 'AI/ML Engineer'],
        'Management and Business': ['Business Analyst', 'Product Manager', 'Operations Manager', 'Marketing Analyst', 'Project Coordinator'],
        'Economics and Finance': ['Financial Analyst', 'Risk Analyst', 'Data Analyst', 'Business Analyst', 'Investment Operations Associate'],
        'Law': ['Legal Assistant', 'Compliance Analyst', 'Corporate Law Track', 'Policy Analyst', 'Legal Researcher'],
        'Medicine': ['Clinical Research Assistant', 'Healthcare Administrator', 'Public Health Analyst', 'Medical Data Coordinator', 'Patient Care Operations']
    };
    var WIZARD_STEPS = [
        { key: 'profile', label: 'Profile', title: 'Start with your direction.', copy: 'Confirm the faculty context and choose the profession area the report should analyze first.' },
        { key: 'skills', label: 'Skills', title: 'What can you actually do?', copy: 'Separate skills you can prove from skills you only know theoretically. The report should be strict about this.' },
        { key: 'evidence', label: 'Evidence', title: 'Show proof, not just claims.', copy: 'Projects, internships, certificates, portfolio links, and real examples make the analysis more reliable.' },
        { key: 'subjects', label: 'Subjects', title: 'Add your academic context.', copy: 'Enter the subjects that matter for your career direction. The agents use them as evidence boundaries.' },
        { key: 'goals', label: 'Goals', title: 'Add constraints and concerns.', copy: 'Good career advice depends on location, salary expectations, time, competition, and AI risk.' },
        { key: 'review', label: 'Review', title: 'Review before the agents work.', copy: 'Check the profile. The live agent workflow will look for missing factors, weak evidence, and realistic next steps.' },
        { key: 'report', label: 'Report', title: 'Career report.', copy: 'The selected provider runs the agent workflow and writes the final report. Provider settings are required before the agents can run.' }
    ];
    var careerWizardState = {
        step: 0,
        data: {
            faculty: '',
            profession: 'Management and Business',
            targets: '',
            technicalSkills: '',
            softSkills: '',
            tools: '',
            experience: '',
            portfolio: '',
            certificates: '',
            passedSubjects: '',
            currentSubjects: '',
            strongestSubjects: '',
            goals: '',
            constraints: '',
        concerns: ''
        },
        report: null,
        agentRun: null,
        attachedEvidence: [],
        currentView: 'chat'
    };
    var CAREER_AGENT_PIPELINE = [
        { id: 'coordinator', order: 1, name: 'Coordinator', shortName: 'Coordinator', icon: 'fas fa-diagram-project', color: '59, 130, 246', stage: 'Routes work', focus: 'Plan the work, identify missing evidence, and assign the specialist agents.', checks: ['intake completeness', 'missing evidence', 'agent handoff order'] },
        { id: 'evidence', order: 2, name: 'Evidence Analyst', shortName: 'Evidence', icon: 'fas fa-fingerprint', color: '16, 185, 129', stage: 'Checks proof', focus: 'Judge claims against projects, subjects, certificates, and visible proof.', checks: ['claimed vs proven skills', 'portfolio strength', 'academic proof'] },
        { id: 'market', order: 3, name: 'Market Analyst', shortName: 'Market', icon: 'fas fa-chart-line', color: '212, 148, 58', stage: 'Reads demand', focus: 'Analyze role demand, competition, hiring keywords, and entry difficulty.', checks: ['target role demand', 'junior-entry difficulty', 'vacancy keywords'] },
        { id: 'risk', order: 4, name: 'AI Risk Analyst', shortName: 'AI Risk', icon: 'fas fa-brain', color: '244, 63, 94', stage: 'Stress-tests roles', focus: 'Assess AI and AGI disruption, automation exposure, and durable human value.', checks: ['automation exposure', 'durable human value', '3-5 year resilience'] },
        { id: 'roadmap', order: 5, name: 'Roadmap Architect', shortName: 'Roadmap', icon: 'fas fa-route', color: '139, 92, 246', stage: 'Builds plan', focus: 'Convert gaps into a 30/60/90-day and 12-month action plan.', checks: ['skill gaps', 'portfolio projects', 'application timing'] },
        { id: 'writer', order: 6, name: 'Report Writer', shortName: 'Writer', icon: 'fas fa-file-pen', color: '6, 182, 212', stage: 'Writes report', focus: 'Synthesize the final professional report from every agent handoff.', checks: ['final recommendation', 'assumptions', 'next actions'] }
    ];
    var CAREER_REPORT_SECTION_TITLES = [
        'Executive Decision',
        'Evidence Review',
        'Role Fit Reality',
        'Risk Assessment',
        'Action Plan',
        'Required Handoff',
        'Agent Audit Summary'
    ];
    var CAREER_AGENT_JSON_SCHEMA = {
        status: 'ok | blocked',
        keyFindings: ['short evidence-bound finding'],
        risks: ['risk or limitation'],
        evidenceMissing: ['missing proof item'],
        recommendations: ['specific next action'],
        handoff: 'one concise handoff sentence',
        confidence: 'low | medium | high'
    };
    function isMob() { return window.innerWidth <= BP; }
    function escapeCareerHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function careerText(id) {
        return String(document.getElementById(id)?.value || '').trim();
    }
    function normalizeCareerProvider(value) {
        var provider = String(value || 'google-gemini').trim().toLowerCase();
        if (provider === 'gemini' || provider === 'google-ai-studio') provider = 'google-gemini';
        if (!PROVIDER_LABELS[provider]) provider = 'google-gemini';
        return provider;
    }
    function getProviderConfig(provider) {
        return PROVIDER_CONFIGS[normalizeCareerProvider(provider)] || PROVIDER_CONFIGS['google-gemini'];
    }
    function readField(name) {
        return String(document.querySelector('[data-career-field="' + name + '"]')?.value || '').trim();
    }
    function fieldHtml(name, label, options) {
        var cfg = options || {};
        var value = careerWizardState.data[name] || '';
        var safeName = escapeCareerHtml(name);
        var safeLabel = escapeCareerHtml(label);
        var placeholder = escapeCareerHtml(cfg.placeholder || '');
        var wide = cfg.wide === false ? '' : ' is-wide';
        if (cfg.type === 'select') {
            return '<div class="career-field' + wide + '"><label class="career-field-label">' + safeLabel + '</label><select class="career-field-select" data-career-field="' + safeName + '">' +
                (cfg.choices || []).map(function(choice) {
                    var selected = choice === value ? ' selected' : '';
                    return '<option value="' + escapeCareerHtml(choice) + '"' + selected + '>' + escapeCareerHtml(choice) + '</option>';
                }).join('') +
                '</select></div>';
        }
        if (cfg.type === 'input') {
            var readonly = cfg.readonly ? ' readonly' : '';
            return '<div class="career-field' + wide + '"><label class="career-field-label">' + safeLabel + '</label><input class="career-field-input" data-career-field="' + safeName + '" type="text" value="' + escapeCareerHtml(value) + '" placeholder="' + placeholder + '"' + readonly + '></div>';
        }
        return '<div class="career-field' + wide + '"><label class="career-field-label">' + safeLabel + '</label><textarea class="career-field-textarea" data-career-field="' + safeName + '" placeholder="' + placeholder + '">' + escapeCareerHtml(value) + '</textarea></div>';
    }
    function persistCareerDraft() {
        try {
            localStorage.setItem(CAREER_INTAKE_DRAFT_KEY, JSON.stringify({ ...careerWizardState.data, savedAt: new Date().toISOString() }));
        } catch (error) {}
    }
    function collectCurrentStepData() {
        document.querySelectorAll('[data-career-field]').forEach(function(field) {
            careerWizardState.data[field.getAttribute('data-career-field')] = String(field.value || '').trim();
        });
        persistCareerDraft();
    }
    function readCareerArray(key) {
        try {
            var parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    function writeCareerArray(key, items, limit) {
        try {
            localStorage.setItem(key, JSON.stringify((items || []).slice(0, limit || 20)));
            return true;
        } catch (error) {
            return false;
        }
    }
    function formatCareerDate(value) {
        var date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) date = new Date();
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    function saveCareerHistory(title, type, payload) {
        var cleanTitle = String(title || '').trim();
        if (!cleanTitle) return;
        var items = readCareerArray(CAREER_HISTORY_KEY).filter(function(item) {
            return String(item.title || '').trim().toLowerCase() !== cleanTitle.toLowerCase();
        });
        items.unshift({
            title: cleanTitle.slice(0, 90),
            type: type || 'chat',
            payload: payload || {},
            createdAt: new Date().toISOString()
        });
        writeCareerArray(CAREER_HISTORY_KEY, items, 12);
        renderCareerHistory();
    }
    function handleCareerHistorySelection(index) {
        var items = readCareerArray(CAREER_HISTORY_KEY);
        var item = items[Number(index) || 0];
        if (!item) return;
        if (item.type === 'report' && item.payload?.report) {
            careerWizardState.report = item.payload.report;
            careerWizardState.step = WIZARD_STEPS.length - 1;
            setCareerView('chat');
            return;
        }
        if (item.type === 'vacancies') {
            setCareerView('vacancies');
            return;
        }
        setCareerView('chat');
        var input = document.getElementById('career-message-input');
        if (input) {
            input.value = item.payload?.message || item.title || '';
            input.focus();
        }
    }
    function createCareerHistoryItemNode(item, index) {
        var button = document.createElement('button');
        button.className = 'career-history-item';
        button.type = 'button';
        button.dataset.careerHistoryIndex = String(index);

        var title = document.createElement('div');
        title.className = 'career-history-title';
        title.textContent = item.title || 'Career activity';

        var date = document.createElement('div');
        date.className = 'career-history-date';
        date.textContent = formatCareerDate(item.createdAt);

        button.append(title, date);
        return button;
    }
    function renderCareerHistory() {
        var container = document.getElementById('career-history-items');
        if (!container) return;
        if (container.dataset.careerHistoryBound !== '1') {
            container.addEventListener('click', function(event) {
                var trigger = event.target.closest('[data-career-history-index]');
                if (!trigger || !container.contains(trigger)) return;
                handleCareerHistorySelection(trigger.getAttribute('data-career-history-index'));
            });
            container.dataset.careerHistoryBound = '1';
        }
        var items = readCareerArray(CAREER_HISTORY_KEY);
        if (!items.length) {
            var empty = document.createElement('div');
            empty.className = 'career-history-empty';
            empty.textContent = 'No saved activity yet.';
            container.replaceChildren(empty);
            return;
        }
        var fragment = document.createDocumentFragment();
        items.forEach(function(item, index) {
            fragment.appendChild(createCareerHistoryItemNode(item, index));
        });
        container.replaceChildren(fragment);
    }
    function saveCareerReport(report) {
        if (!report) return;
        var reports = readCareerArray(CAREER_REPORTS_KEY);
        reports = reports.filter(function(item) {
            return String(item.summary || '') !== String(report.summary || '');
        });
        reports.unshift({ ...report, createdAt: new Date().toISOString() });
        writeCareerArray(CAREER_REPORTS_KEY, reports, 10);
        saveCareerHistory('Career report: ' + (careerWizardState.data.targets || careerWizardState.data.profession || 'latest analysis'), 'report', { report: report });
    }
    function getCareerFacultyLabel() {
        var code = '';
        try {
            code = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '';
        } catch (error) {}
        try {
            if (code && typeof getFacultyLabel === 'function') return getFacultyLabel(code);
        } catch (error) {}
        return code || document.body?.dataset?.faculty || 'Management';
    }
    function readProviderApiKey() {
        try {
            var stored = String(sessionStorage.getItem(CAREER_PROVIDER_API_KEY_SESSION_KEY) || '').trim();
            if (stored) {
                careerProviderApiKeyMemory = stored;
                return stored;
            }
        } catch (error) {}
        return String(careerProviderApiKeyMemory || '').trim();
    }
    function writeProviderApiKey(value) {
        var key = String(value || '').trim();
        careerProviderApiKeyMemory = key;
        try {
            if (key) sessionStorage.setItem(CAREER_PROVIDER_API_KEY_SESSION_KEY, key);
            else sessionStorage.removeItem(CAREER_PROVIDER_API_KEY_SESSION_KEY);
            return true;
        } catch (error) {
            return key === '';
        }
    }
    function readProviderSettings() {
        try {
            var parsed = JSON.parse(localStorage.getItem(CAREER_PROVIDER_SETTINGS_KEY) || '{}');
            var provider = normalizeCareerProvider(parsed.provider);
            return {
                provider: provider,
                model: String(parsed.model || DEFAULT_MODELS[provider] || '').trim(),
                apiKey: readProviderApiKey(),
                instructions: String(parsed.instructions || '').trim(),
                instructionFiles: Array.isArray(parsed.instructionFiles) ? parsed.instructionFiles : [],
                savedAt: String(parsed.savedAt || '').trim()
            };
        } catch (error) {
            return { provider: 'google-gemini', model: DEFAULT_MODELS['google-gemini'], apiKey: '', instructions: '', instructionFiles: [], savedAt: '' };
        }
    }
    function writeProviderSettings(settings) {
        try {
            var provider = normalizeCareerProvider(settings?.provider);
            localStorage.setItem(CAREER_PROVIDER_SETTINGS_KEY, JSON.stringify({
                provider: provider,
                model: String(settings?.model || DEFAULT_MODELS[provider] || '').trim(),
                instructions: String(settings?.instructions || '').trim(),
                instructionFiles: Array.isArray(settings?.instructionFiles) ? settings.instructionFiles : [],
                savedAt: String(settings?.savedAt || '').trim()
            }));
            return writeProviderApiKey(settings?.apiKey || '');
        } catch (error) {
            return false;
        }
    }
    function maskApiKey(value) {
        var key = String(value || '').trim();
        if (!key) return 'No API key saved';
        if (key.length <= 8) return 'Saved key: ****';
        return 'Saved key: ' + key.slice(0, 4) + '...' + key.slice(-4);
    }
    function applyProviderSettings(settings) {
        var provider = settings || readProviderSettings();
        var providerStatus = document.getElementById('career-provider-status');
        var modelStatus = document.getElementById('career-model-status');
        var savedStatus = document.getElementById('career-provider-saved');
        var keyHelp = document.getElementById('career-api-key-help');
        var fileList = document.getElementById('career-provider-file-list');
        var routeTitle = document.getElementById('career-provider-route-title');
        var routeMode = document.getElementById('career-provider-route-mode');
        var routeEndpoint = document.getElementById('career-provider-route-endpoint');
        var routeAuth = document.getElementById('career-provider-route-auth');
        var config = getProviderConfig(provider.provider);
        if (providerStatus) providerStatus.textContent = PROVIDER_LABELS[provider.provider] || 'Provider';
        if (modelStatus) modelStatus.textContent = provider.model || DEFAULT_MODELS[provider.provider] || 'Model not set';
        if (savedStatus) savedStatus.textContent = maskApiKey(provider.apiKey);
        if (routeTitle) routeTitle.textContent = PROVIDER_LABELS[provider.provider] + ' route';
        if (routeMode) routeMode.textContent = config.mode;
        if (routeEndpoint) routeEndpoint.textContent = config.endpoint.replace('{model}', provider.model || DEFAULT_MODELS[provider.provider] || '{model}');
        if (routeAuth) routeAuth.textContent = config.auth;
        if (keyHelp) keyHelp.textContent = provider.apiKey
            ? maskApiKey(provider.apiKey) + '. Stored only in this tab. Leave blank to keep it for this tab.'
            : 'No key saved in this tab yet. Paste an API key and save.';
        if (fileList) {
            var files = provider.instructionFiles || [];
            fileList.innerHTML = files.length
                ? files.map(function(file) { return '<div><i class="fas fa-paperclip"></i> ' + escapeCareerHtml(file.name || 'Instruction file') + '</div>'; }).join('')
                : '<div>No instruction files saved.</div>';
        }
    }
    function populateProviderForm() {
        var settings = readProviderSettings();
        var providerSelect = document.getElementById('career-provider-select');
        var modelInput = document.getElementById('career-model-name-input');
        var keyInput = document.getElementById('career-api-key-input');
        var instructionsInput = document.getElementById('career-provider-instructions');
        if (providerSelect) providerSelect.value = settings.provider;
        if (modelInput) modelInput.value = settings.model || DEFAULT_MODELS[settings.provider] || '';
        if (keyInput) keyInput.value = '';
        if (instructionsInput) instructionsInput.value = settings.instructions || '';
        pendingProviderInstructionFiles = settings.instructionFiles || [];
        applyProviderSettings(settings);
    }
    function ensureCareerTemplateContent(templateId, rootId) {
        var existing = document.getElementById(rootId);
        if (existing) return existing;
        var template = document.getElementById(templateId);
        if (!template || !template.content) return null;
        document.body.appendChild(template.content.cloneNode(true));
        return document.getElementById(rootId);
    }
    function bindProviderModalControls() {
        if (providerModalBindingsReady) return;
        var modal = ensureCareerTemplateContent('career-provider-modal-template', 'career-provider-modal');
        if (!modal) return;
        providerModalBindingsReady = true;
        var providerSelect = document.getElementById('career-provider-select');
        providerSelect?.addEventListener('change', function() {
            var provider = normalizeCareerProvider(providerSelect.value);
            var modelInput = document.getElementById('career-model-name-input');
            if (modelInput) modelInput.value = DEFAULT_MODELS[provider] || '';
            applyProviderSettings({
                ...readProviderSettings(),
                provider: provider,
                model: modelInput?.value || DEFAULT_MODELS[provider] || ''
            });
        });
        document.getElementById('career-provider-close')?.addEventListener('click', closeProviderSettings);
        document.getElementById('career-provider-backdrop')?.addEventListener('click', closeProviderSettings);
        document.getElementById('career-open-instructions')?.addEventListener('click', openInstructionsStudio);
        document.getElementById('career-provider-files')?.addEventListener('change', function(event) {
            var files = Array.from(event.target.files || []).slice(0, 5);
            Promise.all(files.map(readProviderInstructionFile)).then(function(items) {
                pendingProviderInstructionFiles = items;
                var current = readProviderSettings();
                applyProviderSettings({ ...current, instructionFiles: pendingProviderInstructionFiles });
            });
        });
        document.getElementById('career-provider-form')?.addEventListener('submit', function(event) {
            event.preventDefault();
            var current = readProviderSettings();
            var provider = normalizeCareerProvider(document.getElementById('career-provider-select')?.value);
            var apiKeyInput = document.getElementById('career-api-key-input');
            var model = String(document.getElementById('career-model-name-input')?.value || DEFAULT_MODELS[provider] || '').trim();
            var instructions = String(document.getElementById('career-provider-instructions')?.value || '').trim();
            var apiKey = String(apiKeyInput?.value || '').trim() || current.apiKey;
            var next = {
                provider: provider,
                model: model || DEFAULT_MODELS[provider] || '',
                apiKey: apiKey,
                instructions: instructions,
                instructionFiles: pendingProviderInstructionFiles.length ? pendingProviderInstructionFiles : current.instructionFiles || [],
                savedAt: new Date().toISOString()
            };
            var saved = writeProviderSettings(next);
            applyProviderSettings(next);
            if (apiKeyInput) apiKeyInput.value = '';
            var savedStatus = document.getElementById('career-provider-saved');
            if (savedStatus) savedStatus.textContent = saved ? 'Settings saved. ' + maskApiKey(apiKey) + ' Stored in this tab only.' : 'Could not save settings.';
            if (saved) setTimeout(closeProviderSettings, 450);
        });
        document.getElementById('career-provider-test')?.addEventListener('click', async function() {
            var health = document.getElementById('career-provider-health');
            var button = this;
            var original = button.innerHTML;
            collectInstructionStudio();
            var current = readProviderSettings();
            var provider = normalizeCareerProvider(document.getElementById('career-provider-select')?.value || current.provider);
            var apiKeyInput = document.getElementById('career-api-key-input');
            var testSettings = {
                ...current,
                provider: provider,
                model: String(document.getElementById('career-model-name-input')?.value || DEFAULT_MODELS[provider] || '').trim(),
                apiKey: String(apiKeyInput?.value || '').trim() || current.apiKey,
                instructions: String(document.getElementById('career-provider-instructions')?.value || current.instructions || '').trim(),
                instructionFiles: pendingProviderInstructionFiles.length ? pendingProviderInstructionFiles : current.instructionFiles || [],
                savedAt: current.savedAt || new Date().toISOString()
            };
            writeProviderSettings(testSettings);
            applyProviderSettings(testSettings);
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing';
            if (health) health.textContent = 'Sending a real provider request...';
            try {
                var text = await callCareerProvider(
                    'You are a connection test for KIU AI Career Analyst. Reply with one short sentence.',
                    'Confirm the provider connection and model are working.',
                    { maxTokens: 80 }
                );
                if (health) health.textContent = 'Connected: ' + text.slice(0, 180);
            } catch (error) {
                if (health) health.textContent = providerErrorMessage(testSettings.provider, error);
            } finally {
                button.disabled = false;
                button.innerHTML = original;
            }
        });
    }
    function bindInstructionsModalControls() {
        if (instructionsModalBindingsReady) return;
        var modal = ensureCareerTemplateContent('career-instructions-modal-template', 'career-instructions-modal');
        if (!modal) return;
        instructionsModalBindingsReady = true;
        document.getElementById('career-instructions-close')?.addEventListener('click', closeInstructionsStudio);
        document.getElementById('career-instructions-backdrop')?.addEventListener('click', closeInstructionsStudio);
        document.getElementById('career-instructions-save')?.addEventListener('click', function() {
            collectInstructionStudio();
            saveInstructionStudio();
        });
    }
    function bindToolModalControls() {
        if (toolModalBindingsReady) return;
        var modal = ensureCareerTemplateContent('career-tool-modal-template', 'career-tool-modal');
        if (!modal) return;
        toolModalBindingsReady = true;
        document.getElementById('career-tool-close')?.addEventListener('click', closeToolInfo);
        document.getElementById('career-tool-backdrop')?.addEventListener('click', closeToolInfo);
    }
    function setCareerOverlayBodyState(isOpen, stateClass) {
        if (!document.body) return;
        document.body.classList.toggle(stateClass, Boolean(isOpen));
    }
    function openProviderSettings() {
        var modal = ensureCareerTemplateContent('career-provider-modal-template', 'career-provider-modal');
        if (!modal) return;
        bindProviderModalControls();
        populateProviderForm();
        modal.classList.add('is-open');
        setCareerOverlayBodyState(true, 'career-modal-open');
        setTimeout(function() {
            document.getElementById('career-provider-select')?.focus();
        }, 0);
    }
    function closeProviderSettings() {
        var modal = document.getElementById('career-provider-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setCareerOverlayBodyState(false, 'career-modal-open');
    }
    function openToolInfo() {
        var modal = ensureCareerTemplateContent('career-tool-modal-template', 'career-tool-modal');
        if (!modal) return;
        bindToolModalControls();
        modal.classList.add('is-open');
        setCareerOverlayBodyState(true, 'career-modal-open');
    }
    function closeToolInfo() {
        var modal = document.getElementById('career-tool-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setCareerOverlayBodyState(false, 'career-modal-open');
    }
    function readProviderInstructionFile(file) {
        return new Promise(function(resolve) {
            var meta = {
                name: String(file?.name || 'instruction-file'),
                type: String(file?.type || ''),
                size: Number(file?.size || 0),
                storedAs: 'metadata'
            };
            if (!file || file.size > 1024 * 1024) {
                resolve(meta);
                return;
            }
            var reader = new FileReader();
            reader.onload = function() {
                meta.content = String(reader.result || '');
                meta.storedAs = /^image\//i.test(meta.type) ? 'data-url' : 'text';
                resolve(meta);
            };
            reader.onerror = function() { resolve(meta); };
            if (/^image\//i.test(meta.type)) reader.readAsDataURL(file);
            else reader.readAsText(file);
        });
    }
    function defaultInstructionData() {
        var data = {};
        Object.keys(PROVIDER_LABELS).forEach(function(provider) {
            data[provider] = {
                sections: [
                    {
                        title: PROVIDER_LABELS[provider] + ' setup notes',
                        blocks: [
                            { type: 'text', content: 'Paste provider-specific setup instructions, free-tier notes, model names, API endpoint details, limits, and prompt rules here.' }
                        ]
                    }
                ]
            };
        });
        return data;
    }
    function loadInstructionStudio() {
        try {
            var parsed = JSON.parse(localStorage.getItem(CAREER_PROVIDER_INSTRUCTIONS_KEY) || 'null');
            instructionStudioState.data = parsed && typeof parsed === 'object' ? parsed : defaultInstructionData();
        } catch (error) {
            instructionStudioState.data = defaultInstructionData();
        }
        Object.keys(PROVIDER_LABELS).forEach(function(provider) {
            if (!instructionStudioState.data[provider]) {
                instructionStudioState.data[provider] = { sections: [] };
            }
            if (!Array.isArray(instructionStudioState.data[provider].sections) || !instructionStudioState.data[provider].sections.length) {
                instructionStudioState.data[provider].sections = defaultInstructionData()[provider].sections;
            }
        });
    }
    function saveInstructionStudio() {
        try {
            localStorage.setItem(CAREER_PROVIDER_INSTRUCTIONS_KEY, JSON.stringify(instructionStudioState.data));
            var saved = document.getElementById('career-instructions-saved');
            if (saved) saved.textContent = 'Instructions saved locally.';
            return true;
        } catch (error) {
            var failed = document.getElementById('career-instructions-saved');
            if (failed) failed.textContent = 'Could not save instructions.';
            return false;
        }
    }
    function renderInstructionStudio() {
        var tabs = document.getElementById('career-instruction-tabs');
        var editor = document.getElementById('career-instruction-editor');
        if (!tabs || !editor) return;
        tabs.innerHTML = Object.keys(PROVIDER_LABELS).map(function(provider) {
            var active = provider === instructionStudioState.provider ? ' is-active' : '';
            return '<button class="career-instruction-tab' + active + '" type="button" data-instruction-provider="' + provider + '">' + escapeCareerHtml(PROVIDER_LABELS[provider]) + '</button>';
        }).join('');
        tabs.querySelectorAll('[data-instruction-provider]').forEach(function(button) {
            button.addEventListener('click', function() {
                collectInstructionStudio();
                instructionStudioState.provider = normalizeCareerProvider(button.getAttribute('data-instruction-provider'));
                renderInstructionStudio();
            });
        });
        var providerData = instructionStudioState.data[instructionStudioState.provider] || { sections: [] };
        editor.innerHTML = providerData.sections.map(function(section, sectionIndex) {
            return '<section class="career-instruction-section" data-section-index="' + sectionIndex + '">' +
                '<div class="career-instruction-section-head">' +
                    '<input class="career-instruction-section-title-input" type="text" data-section-title="' + sectionIndex + '" value="' + escapeCareerHtml(section.title || '') + '" placeholder="Instruction section title">' +
                    '<button class="career-instruction-mini-btn career-instruction-section-remove-btn" type="button" data-remove-section="' + sectionIndex + '"><i class="fas fa-trash"></i> Remove</button>' +
                '</div>' +
                '<div class="career-instruction-blocks">' +
                    (section.blocks || []).map(function(block, blockIndex) {
                        var label = block.type === 'image' ? 'Image block' : 'Instruction text';
                        var body = block.type === 'image'
                            ? '<img class="career-instruction-image" src="' + escapeCareerHtml(block.src || '') + '" alt="' + escapeCareerHtml(block.name || 'Instruction image') + '">'
                            : '<textarea class="career-instruction-textarea" data-block-text="' + sectionIndex + ':' + blockIndex + '">' + escapeCareerHtml(block.content || '') + '</textarea>';
                        return '<div class="career-instruction-block" draggable="true" data-drag-block="' + sectionIndex + ':' + blockIndex + '" data-block-index="' + blockIndex + '">' +
                            '<div class="career-instruction-block-head"><span class="career-instruction-block-label">' + label + '</span><div class="career-instruction-block-actions">' +
                                '<button class="career-instruction-mini-btn" type="button" data-move-block="' + sectionIndex + ':' + blockIndex + ':up"><i class="fas fa-arrow-up"></i></button>' +
                                '<button class="career-instruction-mini-btn" type="button" data-move-block="' + sectionIndex + ':' + blockIndex + ':down"><i class="fas fa-arrow-down"></i></button>' +
                                '<button class="career-instruction-mini-btn" type="button" data-remove-block="' + sectionIndex + ':' + blockIndex + '"><i class="fas fa-times"></i></button>' +
                            '</div></div>' + body +
                        '</div>';
                    }).join('') +
                '</div>' +
                '<div class="career-instruction-toolbar">' +
                    '<button class="career-instruction-mini-btn career-instruction-add-text-btn" type="button" data-add-text="' + sectionIndex + '"><i class="fas fa-align-left"></i> Add text</button>' +
                    '<label class="career-instruction-mini-btn career-instruction-add-image-btn"><i class="fas fa-image"></i> Add image<input type="file" accept="image/*" data-add-image="' + sectionIndex + '" hidden></label>' +
                '</div>' +
            '</section>';
        }).join('') +
        '<button class="career-instructions-open" type="button" id="career-add-instruction-section"><i class="fas fa-plus"></i> Add instruction section</button>';
        bindInstructionStudioEvents();
    }
    function collectInstructionStudio() {
        var providerData = instructionStudioState.data[instructionStudioState.provider];
        if (!providerData) return;
        document.querySelectorAll('[data-section-title]').forEach(function(input) {
            var index = Number(input.getAttribute('data-section-title'));
            if (providerData.sections[index]) providerData.sections[index].title = String(input.value || '').trim();
        });
        document.querySelectorAll('[data-block-text]').forEach(function(textarea) {
            var parts = String(textarea.getAttribute('data-block-text') || '').split(':');
            var sectionIndex = Number(parts[0]);
            var blockIndex = Number(parts[1]);
            var block = providerData.sections?.[sectionIndex]?.blocks?.[blockIndex];
            if (block) block.content = String(textarea.value || '');
        });
    }
    function moveInstructionBlock(sectionIndex, blockIndex, direction) {
        var blocks = instructionStudioState.data[instructionStudioState.provider]?.sections?.[sectionIndex]?.blocks || [];
        var nextIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
        if (nextIndex < 0 || nextIndex >= blocks.length) return;
        var current = blocks[blockIndex];
        blocks[blockIndex] = blocks[nextIndex];
        blocks[nextIndex] = current;
    }
    function reorderInstructionBlock(sectionIndex, fromIndex, toIndex) {
        var blocks = instructionStudioState.data[instructionStudioState.provider]?.sections?.[sectionIndex]?.blocks || [];
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= blocks.length || toIndex >= blocks.length) return;
        var moved = blocks.splice(fromIndex, 1)[0];
        blocks.splice(toIndex, 0, moved);
    }
    function bindInstructionStudioEvents() {
        document.getElementById('career-add-instruction-section')?.addEventListener('click', function() {
            collectInstructionStudio();
            instructionStudioState.data[instructionStudioState.provider].sections.push({
                title: 'New instruction section',
                blocks: [{ type: 'text', content: '' }]
            });
            renderInstructionStudio();
        });
        document.querySelectorAll('[data-remove-section]').forEach(function(button) {
            button.addEventListener('click', function() {
                collectInstructionStudio();
                var index = Number(button.getAttribute('data-remove-section'));
                instructionStudioState.data[instructionStudioState.provider].sections.splice(index, 1);
                if (!instructionStudioState.data[instructionStudioState.provider].sections.length) {
                    instructionStudioState.data[instructionStudioState.provider].sections.push({ title: 'Instruction section', blocks: [{ type: 'text', content: '' }] });
                }
                renderInstructionStudio();
            });
        });
        document.querySelectorAll('[data-add-text]').forEach(function(button) {
            button.addEventListener('click', function() {
                collectInstructionStudio();
                var sectionIndex = Number(button.getAttribute('data-add-text'));
                instructionStudioState.data[instructionStudioState.provider].sections[sectionIndex].blocks.push({ type: 'text', content: '' });
                renderInstructionStudio();
            });
        });
        document.querySelectorAll('[data-add-image]').forEach(function(input) {
            input.addEventListener('change', function(event) {
                collectInstructionStudio();
                var sectionIndex = Number(input.getAttribute('data-add-image'));
                var file = Array.from(event.target.files || [])[0];
                if (!file) return;
                readProviderInstructionFile(file).then(function(meta) {
                    instructionStudioState.data[instructionStudioState.provider].sections[sectionIndex].blocks.push({
                        type: 'image',
                        name: meta.name,
                        src: meta.content || '',
                        note: meta.storedAs === 'metadata' ? 'Image too large for local preview; metadata saved.' : ''
                    });
                    renderInstructionStudio();
                });
            });
        });
        document.querySelectorAll('[data-move-block]').forEach(function(button) {
            button.addEventListener('click', function() {
                collectInstructionStudio();
                var parts = String(button.getAttribute('data-move-block') || '').split(':');
                moveInstructionBlock(Number(parts[0]), Number(parts[1]), parts[2]);
                renderInstructionStudio();
            });
        });
        document.querySelectorAll('[data-remove-block]').forEach(function(button) {
            button.addEventListener('click', function() {
                collectInstructionStudio();
                var parts = String(button.getAttribute('data-remove-block') || '').split(':');
                var blocks = instructionStudioState.data[instructionStudioState.provider].sections[Number(parts[0])].blocks;
                blocks.splice(Number(parts[1]), 1);
                if (!blocks.length) blocks.push({ type: 'text', content: '' });
                renderInstructionStudio();
            });
        });
        document.querySelectorAll('[data-drag-block]').forEach(function(block) {
            block.addEventListener('dragstart', function(event) {
                collectInstructionStudio();
                event.dataTransfer.setData('text/plain', block.getAttribute('data-drag-block') || '');
                event.dataTransfer.effectAllowed = 'move';
            });
            block.addEventListener('dragover', function(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            });
            block.addEventListener('drop', function(event) {
                event.preventDefault();
                var from = String(event.dataTransfer.getData('text/plain') || '').split(':').map(Number);
                var to = String(block.getAttribute('data-drag-block') || '').split(':').map(Number);
                if (from[0] !== to[0]) return;
                reorderInstructionBlock(from[0], from[1], to[1]);
                renderInstructionStudio();
            });
        });
    }
    function openInstructionsStudio() {
        loadInstructionStudio();
        var current = readProviderSettings();
        instructionStudioState.provider = normalizeCareerProvider(current.provider);
        ensureCareerTemplateContent('career-instructions-modal-template', 'career-instructions-modal');
        bindInstructionsModalControls();
        renderInstructionStudio();
        var modal = document.getElementById('career-instructions-modal');
        if (!modal) return;
        modal.classList.add('is-open');
        setCareerOverlayBodyState(true, 'career-modal-open');
    }
    function closeInstructionsStudio() {
        collectInstructionStudio();
        var modal = document.getElementById('career-instructions-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setCareerOverlayBodyState(false, 'career-modal-open');
    }
    function getRole() {
        var role = '';
        try {
            role = typeof getEffectiveRole === 'function'
                ? getEffectiveRole()
                : (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '');
        } catch (error) {}
        return role || 'student';
    }
    function openStudio() {
        var button = document.getElementById('lux-palette-btn') || document.querySelector('.lux-topbar-editor-btn');
        if (button) { button.click(); return; }
        var studio = document.getElementById('lux-studio-backdrop');
        if (studio) studio.classList.add('is-open');
    }
    function closeSidebarOnMobile() {
        if (!isMob()) return;
        if (!document.body.classList.contains('lux-sidebar-collapsed')) {
            if (typeof window.toggleSidebar === 'function') window.toggleSidebar();
            else {
                document.body.classList.add('lux-sidebar-collapsed');
                document.body.dataset.luxSidebar = 'collapsed';
            }
        }
    }
    function syncActive(target) {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(button) {
            button.classList.toggle('is-active', button.getAttribute('data-nav-target') === target);
        });
        ['mob-nav-messages', 'mob-nav-notif', 'mob-nav-theme', 'mob-nav-more'].forEach(function(id) {
            var button = document.getElementById(id);
            if (button) button.classList.remove('is-active');
        });
    }
    function isElementShown(element) {
        return Boolean(element) && !element.hidden;
    }
    function setElementShown(element, shown, displayValue) {
        if (!element) return;
        element.hidden = !shown;
    }
    function closeSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        sheet.classList.remove('is-open');
        setCareerOverlayBodyState(false, 'career-sheet-open');
        setTimeout(function() { setElementShown(sheet, false); }, 300);
    }
    function openSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        buildRoleNav();
        setElementShown(sheet, true);
        setCareerOverlayBodyState(true, 'career-sheet-open');
        requestAnimationFrame(function() { sheet.classList.add('is-open'); });
    }
    function toggleSheet() {
        var sheet = document.getElementById('mobile-action-sheet');
        if (!sheet) return;
        isElementShown(sheet) ? closeSheet() : openSheet();
    }
    function buildRoleNav() {
        var container = document.getElementById('mob-sheet-dynamic-nav');
        if (!container) return;
        var NAV = {
            student: [
                { group: 'Core', items: [['home','Dashboard','fas fa-th-large'], ['lms','LMS','fas fa-book-reader'], ['timetable','Timetable','fas fa-chalkboard'], ['registration','Registration','fas fa-check-square']] },
                { group: 'Records', items: [['programs','Programs','fas fa-file-signature'], ['study-card','Study Card','far fa-address-card'], ['personal-data','Personal Data','far fa-user']] },
                { group: 'Support', items: [['news','News','fas fa-newspaper'], ['career-market','AI Career Analyst','fas fa-compass'], ['chancellery','E-Chancellery','fas fa-desktop'], ['student-service','Student Service','fas fa-headset'], ['library','Library','fas fa-book'], ['social','Social','fas fa-comments']] }
            ],
            admin: [
                { group: 'Control', items: [['home','Dashboard','fas fa-hammer'], ['admin-tools','Admin Tools','fas fa-layer-group'], ['admin-scheduler','Scheduler','fas fa-calendar-plus'], ['staff','Staff','fas fa-users-cog'], ['students-admin','Students','fas fa-user-graduate']] },
                { group: 'Systems', items: [['news','News','fas fa-newspaper'], ['library','Library','fas fa-book'], ['orders','Orders','fas fa-book-open'], ['social','Social','fas fa-comments'], ['programs','Programs','fas fa-layer-group']] }
            ],
            professor: [
                { group: 'Faculty', items: [['home','Dashboard','fas fa-th-large'], ['timetable','Schedule','fas fa-calendar-week'], ['lms','LMS','fas fa-book-reader'], ['exams','Exams','fas fa-file-signature'], ['programs','Programs','fas fa-layer-group']] },
                { group: 'Campus', items: [['news','News','fas fa-newspaper'], ['library','Library','fas fa-book'], ['social','Social','fas fa-comments'], ['chancellery','Appeals','fas fa-inbox']] }
            ],
            ta: [
                { group: 'Faculty', items: [['home','Dashboard','fas fa-th-large'], ['timetable','Schedule','fas fa-calendar-week'], ['lms','LMS','fas fa-book-reader'], ['programs','Programs','fas fa-layer-group']] },
                { group: 'Support', items: [['news','News','fas fa-newspaper'], ['library','Library','fas fa-book'], ['social','Social','fas fa-comments'], ['chancellery','Appeals','fas fa-inbox']] }
            ],
            student_service: [
                { group: 'Service', items: [['home','Dashboard','fas fa-th-large'], ['student-service','Inbox','fas fa-inbox'], ['orders','Orders','fas fa-book-open'], ['library','Library','fas fa-book']] },
                { group: 'Campus', items: [['news','News','fas fa-newspaper'], ['social','Social','fas fa-comments']] }
            ]
        };
        var groups = NAV[getRole()] || NAV.student;
        container.innerHTML = groups.map(function(group) {
            return '<div class="mob-sheet-section"><div class="mob-sheet-label">' + group.group + '</div><div class="mob-sheet-nav">' +
                group.items.map(function(item) {
                    return '<button class="mob-sheet-nav-btn" data-nav-target="' + item[0] + '" type="button"><i class="' + item[2] + '"></i><span>' + item[1] + '</span></button>';
                }).join('') +
                '</div></div>';
        }).join('');
        container.querySelectorAll('.mob-sheet-nav-btn[data-nav-target]').forEach(function(button) {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                var target = button.getAttribute('data-nav-target');
                if (typeof window.navigate === 'function') window.navigate(target);
                else window.location.assign(target + '.html');
                syncActive(target);
                closeSheet();
                closeSidebarOnMobile();
            });
        });
    }
    function setupMobileNav() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(button) {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                var target = button.getAttribute('data-nav-target');
                if (typeof window.navigate === 'function') window.navigate(target);
                else window.location.assign(target + '.html');
                syncActive(target);
                closeSheet();
                closeSidebarOnMobile();
            });
        });
        document.getElementById('mob-nav-theme')?.addEventListener('click', function(event) {
            event.preventDefault();
            openStudio();
        });
        document.getElementById('mob-nav-more')?.addEventListener('click', function(event) {
            event.preventDefault();
            toggleSheet();
        });
        document.getElementById('mob-nav-messages')?.addEventListener('click', function(event) {
            event.preventDefault();
            var button = document.getElementById('lux-chat-btn');
            if (button) button.click();
        });
        document.getElementById('mob-nav-notif')?.addEventListener('click', function(event) {
            event.preventDefault();
            var button = document.getElementById('lux-notification-btn');
            if (button) button.click();
        });
        document.getElementById('mob-sheet-backdrop')?.addEventListener('click', closeSheet);
        document.getElementById('mob-sheet-close')?.addEventListener('click', closeSheet);
        document.getElementById('mob-act-theme')?.addEventListener('click', function() { closeSheet(); openStudio(); });
        document.getElementById('mob-act-profile')?.addEventListener('click', function() { closeSheet(); if (typeof window.navigate === 'function') window.navigate('profile-view'); });
        document.getElementById('mob-act-lightmode')?.addEventListener('click', function() {
            var nextMode = typeof window.toggleLuxuryInterfaceMode === 'function'
                ? window.toggleLuxuryInterfaceMode()
                : (document.body.classList.toggle('lux-light-mode'), document.body.classList.contains('lux-light-mode') ? 'light' : 'dark');
            var isLight = nextMode === 'light';
            this.querySelector('span').textContent = isLight ? 'Dark Mode' : 'Light Mode';
            this.querySelector('i').className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        });
    }
    function onResize() {
        var nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;
        setElementShown(nav, isMob());
        if (!isMob()) closeSheet();
    }
    function appendMessage(text, author) {
        var list = document.getElementById('career-message-list');
        var empty = document.getElementById('career-empty-state');
        if (!list || !text) return;
        list.classList.add('has-messages');
        setElementShown(empty, false);
        var isUser = author === 'user';
        list.insertAdjacentHTML('beforeend',
            '<article class="career-message' + (isUser ? ' is-user' : '') + '">' +
                '<div class="career-avatar"><i class="' + (isUser ? 'fas fa-user' : 'fas fa-compass') + '"></i></div>' +
                '<div class="career-bubble">' + (isUser ? '' : '<strong>AI Career Analyst</strong>') + '<span></span></div>' +
            '</article>');
        list.lastElementChild.querySelector('span').textContent = text;
        list.lastElementChild.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
    function buildCareerIntakeText() {
        var data = careerWizardState.data || {};
        var evidenceText = (careerWizardState.attachedEvidence || []).map(function(item) {
            return item.name + ' - ' + (item.summary || item.type || 'attached file');
        }).join(' | ');
        return [
            'Faculty: ' + (data.faculty || 'not provided'),
            'Profession area: ' + (data.profession || 'not provided'),
            'Target roles: ' + (data.targets || 'not provided'),
            'Technical/domain skills: ' + (data.technicalSkills || 'not provided'),
            'Soft skills/languages: ' + (data.softSkills || 'not provided'),
            'Tools/platforms: ' + (data.tools || 'not provided'),
            'Experience/projects: ' + (data.experience || 'not provided'),
            'Portfolio links: ' + (data.portfolio || 'not provided'),
            'Certificates: ' + (data.certificates || 'not provided'),
            'Passed subjects: ' + (data.passedSubjects || 'not provided'),
            'Current subjects: ' + (data.currentSubjects || 'not provided'),
            'Strongest/weakest subjects: ' + (data.strongestSubjects || 'not provided'),
            'Goals: ' + (data.goals || 'not provided'),
            'Constraints: ' + (data.constraints || 'not provided'),
            'Concerns: ' + (data.concerns || 'not provided'),
            'Attached evidence: ' + (evidenceText || 'not provided')
        ].join('\n');
    }
    function roleSpecificEvidenceNeeds() {
        var roles = String(careerWizardState.data?.targets || '').toLowerCase();
        var needs = [];
        if (/business analyst|\bba\b/.test(roles)) {
            needs.push('Business Analyst: Excel or SQL proof, process map, requirements document, stakeholder interview example.');
        }
        if (/product manager|\bpm\b/.test(roles)) {
            needs.push('Product Manager: user problem, PRD, roadmap, user research notes, Jira or backlog example.');
        }
        if (/operations|ops/.test(roles)) {
            needs.push('Operations: process improvement example, KPI tracking, scheduling/resource planning, Lean or workflow evidence.');
        }
        return needs.length ? needs : ['Choose one priority role so the system can request role-specific proof.'];
    }
    function buildWeakIntakeDiagnostic() {
        var quality = analyzeCareerIntakeQuality();
        return {
            summary: 'Missing Evidence Diagnostic. The intake is too weak for a full career roadmap, so the system is returning the evidence required to make the next report useful.',
            scores: buildCareerScoreSnapshot(),
            qualityNotes: ['Diagnostic mode used because intake score is below 40%.'],
            sections: [
                {
                    title: 'Decision',
                    body: 'Do not treat this as a career roadmap yet. The student has not provided enough evidence to support role-fit claims. The next step is intake repair and baseline evidence collection.'
                },
                {
                    title: 'Missing Intake Categories',
                    body: quality.missing.map(function(item) { return item.label + ': ' + item.fix; }).join('\n')
                },
                {
                    title: 'Role-Specific Evidence Needed',
                    body: roleSpecificEvidenceNeeds().join('\n')
                },
                {
                    title: 'Minimum Next Submission',
                    body: 'The student should submit current subjects, passed subjects, language level, tools used, one academic project or assignment, any certificate, and one priority role. Without these, recommendations must stay generic and low-confidence.'
                },
                {
                    title: 'Next 7 Days',
                    body: 'Complete the intake. Add a CV if available. If no CV exists, list university modules and any class assignments. Pick one target role first, then build one small proof item for that role.'
                }
            ]
        };
    }
    function careerHasMeaning(value) {
        var text = String(value || '').trim().toLowerCase();
        if (!text) return false;
        if (/^(no|none|nothing|n\/a|na|null|empty|not provided|i don't have any|i dont have any|don't have any|dont have any|i have none|nope|-)+[.! ]*$/i.test(text)) return false;
        if (text.replace(/[^a-z0-9]/g, '').length < 3) return false;
        return true;
    }
    function analyzeCareerIntakeQuality() {
        var data = careerWizardState.data || {};
        var checks = [
            { id: 'targets', label: 'Target roles', ok: careerHasMeaning(data.targets), fix: 'Choose 1-3 target roles.' },
            { id: 'skills', label: 'Skills', ok: [data.technicalSkills, data.softSkills, data.tools].some(careerHasMeaning), fix: 'Add practical skills, tools, and languages.' },
            { id: 'evidence', label: 'Evidence', ok: [data.experience, data.portfolio, data.certificates].some(careerHasMeaning) || (careerWizardState.attachedEvidence || []).length > 0, fix: 'Attach projects, CV, certificates, or portfolio links.' },
            { id: 'academics', label: 'Academic context', ok: [data.passedSubjects, data.currentSubjects, data.strongestSubjects].some(careerHasMeaning), fix: 'Add passed/current subjects and strong/weak subjects.' },
            { id: 'goals', label: 'Goals and constraints', ok: [data.goals, data.constraints, data.concerns].some(careerHasMeaning), fix: 'Add internship/job goal, time limits, location, salary, or concerns.' }
        ];
        var readyCount = checks.filter(function(check) { return check.ok; }).length;
        return {
            checks: checks,
            readyCount: readyCount,
            score: Math.round((readyCount / checks.length) * 100),
            level: readyCount >= 4 ? 'Ready' : (readyCount >= 2 ? 'Partial' : 'Weak'),
            missing: checks.filter(function(check) { return !check.ok; })
        };
    }
    function renderIntakeQualityPanel() {
        var quality = analyzeCareerIntakeQuality();
        return '<div class="career-intake-gate">' +
            '<div class="career-intake-gate-head">' +
                '<div><strong class="career-intake-gate-title">Intake quality</strong><span class="career-intake-gate-copy">' + escapeCareerHtml(quality.level) + ' context for agent reasoning</span></div>' +
                '<em>' + String(quality.score) + '%</em>' +
            '</div>' +
            '<div class="career-intake-checks">' + quality.checks.map(function(check) {
                return '<div class="career-intake-check' + (check.ok ? ' is-ok' : '') + '">' +
                    '<i class="fas ' + (check.ok ? 'fa-check' : 'fa-plus') + '"></i>' +
                    '<span>' + escapeCareerHtml(check.label) + '</span>' +
                '</div>';
            }).join('') + '</div>' +
            (quality.missing.length ? '<p class="career-intake-gate-note">Needed next: ' + escapeCareerHtml(quality.missing.slice(0, 3).map(function(check) { return check.fix; }).join(' ')) + '</p>' : '<p class="career-intake-gate-note">Enough context for the agents to produce a specific report.</p>') +
        '</div>';
    }
    function createAgentRunState(settings) {
        return {
            running: true,
            provider: settings ? settings.provider : '',
            model: settings ? settings.model : '',
            startedAt: new Date().toISOString(),
            logs: [],
            outputs: {},
            structured: {},
            live: {},
            attempts: {},
            providerHealth: {},
            finalEditor: 'idle',
            activeTab: 'live',
            nodes: CAREER_AGENT_PIPELINE.reduce(function(acc, agent) {
                acc[agent.id] = 'waiting';
                return acc;
            }, {})
        };
    }
    function renderAgentConsoleInner() {
        var run = careerWizardState.agentRun || createAgentRunState(readProviderSettings());
        if (!careerWizardState.agentRun) run.running = false;
        var settings = readProviderSettings();
        var providerLabel = PROVIDER_LABELS[settings.provider] || 'Provider';
        var activeTab = run.activeTab || 'live';
        var nodes = CAREER_AGENT_PIPELINE.map(function(agent) {
            var state = run.nodes[agent.id] || 'waiting';
            var roleClass = agent.id === 'coordinator' ? ' is-coordinator' : ' is-specialist';
            var checkText = (agent.checks || []).slice(0, 3).join(' | ');
            var liveItems = (run.live?.[agent.id] || []).slice(-4);
            var generated = String(run.generating?.[agent.id] || '').trim();
            var health = run.providerHealth?.[agent.id] || 'queued';
            var attempt = run.attempts?.[agent.id] ? ('attempt ' + run.attempts[agent.id] + '/5') : 'not sent';
            return '<div class="career-agent-node' + roleClass + ' is-' + escapeCareerHtml(state) + '" data-agent-id="' + escapeCareerHtml(agent.id) + '">' +
                '<b>' + String(agent.order || '') + '</b>' +
                '<i class="' + agent.icon + '"></i>' +
                '<strong>' + escapeCareerHtml(agent.shortName || agent.name) + '</strong>' +
                '<span>' + escapeCareerHtml(state === 'done' ? 'Completed handoff' : (state === 'active' ? 'Working now' : (state === 'error' ? 'Needs provider attention' : agent.focus))) + '</span>' +
                '<small>' + escapeCareerHtml(agent.stage + ' - ' + checkText) + '</small>' +
                '<div class="career-agent-status-row">' +
                    '<em class="career-agent-status-chip">' + escapeCareerHtml(attempt) + '</em>' +
                    '<em class="career-agent-status-chip">' + escapeCareerHtml(health) + '</em>' +
                '</div>' +
                '<div class="career-agent-live">' +
                    (generated ? '<p class="is-generating">' + escapeCareerHtml(generated) + '</p>' : '') +
                    (liveItems.length ? liveItems.map(function(item) { return '<p>' + escapeCareerHtml(item) + '</p>'; }).join('') : '<p>Waiting for workflow signal.</p>') +
                '</div>' +
            '</div>';
        }).join('');
        var logs = run.logs.length ? run.logs.map(function(log) {
            return '<article class="career-agent-log">' +
                '<div class="career-agent-log-head">' +
                    '<strong class="career-agent-log-title">' + escapeCareerHtml(log.agent) + '</strong>' +
                    '<span class="career-agent-log-status">' + escapeCareerHtml(log.status) + '</span>' +
                '</div>' +
                '<pre class="career-agent-output">' + escapeCareerHtml(log.text || '') + '</pre>' +
            '</article>';
        }).join('') : '<article class="career-agent-log career-agent-log--empty"><strong class="career-agent-log-title">Execution queue</strong><span class="career-agent-log-status">Waiting for the first agent handoff.</span></article>';
        var findings = CAREER_AGENT_PIPELINE.map(function(agent) {
            var item = run.structured?.[agent.id];
            if (!item) return '';
            var rows = []
                .concat(item.keyFindings.map(function(value) { return 'Finding: ' + value; }))
                .concat(item.evidenceMissing.map(function(value) { return 'Missing: ' + value; }))
                .concat(item.recommendations.map(function(value) { return 'Next: ' + value; }));
            return '<article class="career-agent-finding-card"><div class="career-agent-finding-head"><strong class="career-agent-finding-title">' + escapeCareerHtml(agent.name) + '</strong><span class="career-agent-finding-confidence">' + escapeCareerHtml(item.confidence + ' confidence') + '</span></div>' +
                '<ul class="career-agent-finding-points">' + rows.map(function(value) { return '<li>' + escapeCareerHtml(value) + '</li>'; }).join('') + '</ul></article>';
        }).filter(Boolean).join('');
        var reportPreview = careerWizardState.report
            ? renderReportDocument(careerWizardState.report)
            : '<div class="career-section-note">Final report is waiting for all agents and the Chief Report Editor.</div>';
        var tabHtml = '<div class="career-agent-tabs">' +
            '<button class="career-agent-tab' + (activeTab === 'live' ? ' is-active' : '') + '" type="button" data-career-agent-tab="live">Live work</button>' +
            '<button class="career-agent-tab' + (activeTab === 'findings' ? ' is-active' : '') + '" type="button" data-career-agent-tab="findings">Findings</button>' +
            '<button class="career-agent-tab' + (activeTab === 'report' ? ' is-active' : '') + '" type="button" data-career-agent-tab="report">Final report</button>' +
        '</div>';
        var tabBody = activeTab === 'findings'
            ? '<div class="career-agent-finding-list">' + (findings || '<div class="career-section-note">Structured findings appear as agents complete.</div>') + '</div>'
            : (activeTab === 'report' ? reportPreview : '<div class="career-agent-stream">' + logs + '</div>');
        return '<div class="career-provider-chip"><i class="fas fa-plug"></i> ' + escapeCareerHtml(providerLabel) + '</div>' +
            '<div class="career-provider-chip"><i class="fas fa-microchip"></i> ' + escapeCareerHtml(settings.model || 'Model not set') + '</div>' +
            '<div class="career-provider-chip"><i class="fas fa-pen-nib"></i> Editor: ' + escapeCareerHtml(run.finalEditor || 'idle') + '</div>' +
            '<div class="career-agent-topology">' + nodes + '</div>' +
            tabHtml + tabBody;
    }
    function renderAgentConsoleHtml() {
        return '<div class="career-agent-console" id="career-agent-console">' + renderAgentConsoleInner() + '</div>';
    }
    function renderAgentConsole() {
        var consoleEl = document.getElementById('career-agent-console');
        if (consoleEl) {
            consoleEl.innerHTML = renderAgentConsoleInner();
            wireAgentConsoleTabs(consoleEl);
        }
    }
    function wireAgentConsoleTabs(root) {
        (root || document).querySelectorAll('[data-career-agent-tab]').forEach(function(button) {
            button.addEventListener('click', function() {
                if (!careerWizardState.agentRun) return;
                careerWizardState.agentRun.activeTab = button.getAttribute('data-career-agent-tab') || 'live';
                renderAgentConsole();
            });
        });
    }
    function pushAgentLog(agent, status, text) {
        if (!careerWizardState.agentRun) return;
        careerWizardState.agentRun.live[agent.id] = careerWizardState.agentRun.live[agent.id] || [];
        careerWizardState.agentRun.live[agent.id].push(status + ': ' + String(text || '').replace(/\s+/g, ' ').slice(0, 180));
        careerWizardState.agentRun.logs.push({
            agent: agent.name,
            status: status,
            text: text || '',
            at: new Date().toISOString()
        });
        renderAgentConsole();
    }
    function cleanAgentOutput(text) {
        var raw = String(text || '').trim();
        raw = raw.replace(/PLAN\s*\$\\rightarrow\$\s*FINDINGS\s*\$\\rightarrow\$\s*HANDOFF\.?/gi, '');
        raw = raw.replace(/PLAN\s*->\s*FINDINGS\s*->\s*HANDOFF\.?/gi, '');
        var planIndex = raw.search(/(?:\*\*)?PLAN(?:\*\*)?/i);
        if (planIndex > 0) raw = raw.slice(planIndex);
        var secondPlan = raw.slice(6).search(/\b(?:\*\*)?PLAN(?:\*\*)?\b/i);
        if (secondPlan > 0 && raw.slice(0, secondPlan).length < 1600) raw = raw.slice(secondPlan + 6);
        raw = raw.replace(/\*Wait,[\s\S]*?(?=\*\*PLAN\*\*|PLAN\b|$)/i, '');
        raw = raw.replace(/^\s*[\*-]\s*Intake Quality Score:[\s\S]*?(?=\*\*PLAN\*\*|PLAN\b|$)/i, '');
        raw = raw.replace(/^(?:.*?KIU AI Career Analyst.*?\n){1,3}/i, '');
        raw = raw.replace(/\*\*(PLAN|FINDINGS|HANDOFF|UNCERTAINTY|EVIDENCE)\*\*/gi, '$1');
        raw = raw.replace(/\n{3,}/g, '\n\n');
        return raw.trim() || String(text || '').trim();
    }
    function extractJsonObject(text) {
        var raw = String(text || '').trim();
        if (!raw) return null;
        raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
        try { return JSON.parse(raw); } catch (error) {}
        var start = raw.indexOf('{');
        var end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try { return JSON.parse(raw.slice(start, end + 1)); } catch (error) {}
        }
        return null;
    }
    function normalizeStringArray(value, limit) {
        var items = Array.isArray(value) ? value : (value ? [value] : []);
        return items.map(function(item) { return String(item || '').trim(); }).filter(Boolean).slice(0, limit || 6);
    }
    function normalizeAgentStructured(raw, fallbackText) {
        var data = raw && typeof raw === 'object' ? raw : {};
        return {
            status: ['ok', 'blocked'].includes(String(data.status || '').toLowerCase()) ? String(data.status).toLowerCase() : 'ok',
            keyFindings: normalizeStringArray(data.keyFindings || data.findings || data.finding, 5),
            risks: normalizeStringArray(data.risks || data.risk, 4),
            evidenceMissing: normalizeStringArray(data.evidenceMissing || data.missingEvidence || data.missing, 5),
            recommendations: normalizeStringArray(data.recommendations || data.nextActions || data.actions, 5),
            handoff: String(data.handoff || data.summary || fallbackText || '').trim().replace(/\s+/g, ' ').slice(0, 420),
            confidence: ['low', 'medium', 'high'].includes(String(data.confidence || '').toLowerCase()) ? String(data.confidence).toLowerCase() : 'low',
            rawText: String(fallbackText || '').trim()
        };
    }
    function structuredAgentToLiveText(agent, structured) {
        var parts = [];
        if (structured.keyFindings.length) parts.push('Findings: ' + structured.keyFindings.join(' '));
        if (structured.evidenceMissing.length) parts.push('Missing: ' + structured.evidenceMissing.join(' '));
        if (structured.recommendations.length) parts.push('Next: ' + structured.recommendations.join(' '));
        if (structured.handoff) parts.push('Handoff: ' + structured.handoff);
        return parts.join('\n\n') || cleanAgentOutput(structured.rawText || agent.focus);
    }
    function parseAgentProviderOutput(agent, text) {
        var json = extractJsonObject(text);
        var structured = normalizeAgentStructured(json, cleanAgentOutput(text));
        return {
            structured: structured,
            displayText: structuredAgentToLiveText(agent, structured)
        };
    }
    async function revealAgentWords(agent, text) {
        if (!careerWizardState.agentRun) return;
        var clean = cleanAgentOutput(text);
        var words = clean.split(/\s+/).filter(Boolean).slice(0, 170);
        careerWizardState.agentRun.generating = careerWizardState.agentRun.generating || {};
        careerWizardState.agentRun.generating[agent.id] = '';
        for (var i = 0; i < words.length; i += 1) {
            careerWizardState.agentRun.generating[agent.id] += (i ? ' ' : '') + words[i];
            if (i % 4 === 0 || i === words.length - 1) {
                renderAgentConsole();
                await waitCareer(22);
            }
        }
    }
    function setAgentStatus(agentId, status) {
        if (!careerWizardState.agentRun) return;
        careerWizardState.agentRun.nodes[agentId] = status;
        renderAgentConsole();
    }
    function extractOpenAiText(json) {
        if (json?.output_text) return String(json.output_text || '').trim();
        var chunks = [];
        (json?.output || []).forEach(function(item) {
            (item.content || []).forEach(function(part) {
                if (part.text) chunks.push(part.text);
                if (part.type === 'output_text' && part.text) chunks.push(part.text);
            });
        });
        return chunks.join('\n').trim();
    }
    function extractProviderText(provider, json) {
        if (provider === 'openai') return extractOpenAiText(json);
        if (provider === 'google-gemini') {
            return String(json?.candidates?.[0]?.content?.parts?.map(function(part) { return part.text || ''; }).join('\n') || '').trim();
        }
        return String(json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '').trim();
    }
    function providerErrorMessage(provider, error) {
        var label = PROVIDER_LABELS[provider] || 'Provider';
        return label + ' request failed: ' + (error && error.message ? error.message : 'unknown error');
    }
    function waitCareer(ms) {
        return new Promise(function(resolve) { setTimeout(resolve, ms); });
    }
    function isRetryableCareerProviderError(error) {
        var message = String(error?.message || '').toLowerCase();
        return Boolean(
            error?.name === 'AbortError' ||
            /high demand|overloaded|temporar|try again|rate limit|quota|timeout|timed out|429|500|502|503|504/.test(message)
        );
    }
    async function callCareerProviderWithRetry(systemPrompt, userPrompt, options) {
        var attempts = Number(options?.attempts || 5);
        var delayMs = Number(options?.retryDelayMs || 5000);
        var agent = options?.agent || null;
        var lastError = null;
        for (var attempt = 1; attempt <= attempts; attempt += 1) {
            if (agent && careerWizardState.agentRun) {
                careerWizardState.agentRun.attempts[agent.id] = attempt;
                careerWizardState.agentRun.providerHealth[agent.id] = 'attempt ' + attempt + '/' + attempts;
                pushAgentLog(agent, 'Attempt ' + attempt + '/' + attempts, 'Sending request to provider.');
            }
            try {
                var text = await callCareerProvider(systemPrompt, userPrompt, options);
                if (agent && careerWizardState.agentRun) {
                    careerWizardState.agentRun.providerHealth[agent.id] = 'completed on attempt ' + attempt;
                    pushAgentLog(agent, 'Provider response', 'Received response on attempt ' + attempt + '.');
                }
                return text;
            } catch (error) {
                lastError = error;
                var retryable = isRetryableCareerProviderError(error);
                if (agent && careerWizardState.agentRun) {
                    careerWizardState.agentRun.providerHealth[agent.id] = retryable && attempt < attempts ? 'retrying after provider error' : 'failed';
                    pushAgentLog(agent, retryable && attempt < attempts ? 'Retry scheduled' : 'Request failed', providerErrorMessage(readProviderSettings().provider, error));
                }
                if (!retryable || attempt >= attempts) break;
                if (agent) pushAgentLog(agent, 'Waiting 5 seconds', 'Provider is busy. Automatic retry will run next.');
                await waitCareer(delayMs);
            }
        }
        throw lastError;
    }
    function buildProviderInstructionContext(settings) {
        var parts = [];
        if (settings?.instructions) parts.push('Manual provider instructions:\n' + settings.instructions);
        (settings?.instructionFiles || []).slice(0, 5).forEach(function(file) {
            if (file?.content && String(file.content).length < 12000) {
                parts.push('Instruction file "' + (file.name || 'file') + '":\n' + String(file.content).slice(0, 6000));
            } else if (file?.name) {
                parts.push('Instruction file reference: ' + file.name + ' (' + (file.type || 'unknown type') + ').');
            }
        });
        return parts.join('\n\n');
    }
    async function postCareerJson(url, headers, body) {
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, 90000);
        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
                signal: controller.signal
            });
            var text = await response.text();
            var json = {};
            try { json = text ? JSON.parse(text) : {}; } catch (error) { json = { raw: text }; }
            if (!response.ok) {
                var message = json?.error?.message || json?.message || text || ('HTTP ' + response.status);
                throw new Error(message);
            }
            return json;
        } finally {
            clearTimeout(timer);
        }
    }
    async function callCareerBackendProxy(provider, model, apiKey, systemPrompt, userPrompt, maxTokens) {
        if (typeof getKiuPortalBackendUrl !== 'function') throw new Error('Portal backend URL helper is unavailable.');
        var baseUrl = String(getKiuPortalBackendUrl() || '').replace(/\/$/, '');
        if (!baseUrl) throw new Error('Portal backend URL is not configured.');
        var controller = new AbortController();
        var timer = setTimeout(function() { controller.abort(); }, 90000);
        try {
            var response = await fetch(baseUrl + '/api/ai/career-completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(typeof getPortalSessionToken === 'function' && getPortalSessionToken() ? { 'X-Portal-Session': getPortalSessionToken() } : {})
                },
                body: JSON.stringify({
                    provider: provider,
                    model: model,
                    apiKey: apiKey,
                    systemPrompt: systemPrompt,
                    userPrompt: userPrompt,
                    maxTokens: maxTokens
                }),
                cache: 'no-store',
                signal: controller.signal
            });
            var payload = await response.json().catch(function() { return null; });
            if (!response.ok) {
                var error = new Error(payload?.error || payload?.message || ('Backend AI proxy failed with HTTP ' + response.status + '.'));
                error.backendReachable = response.status !== 404;
                throw error;
            }
            return String(payload?.text || '').trim();
        } finally {
            clearTimeout(timer);
        }
    }
    async function callCareerProvider(systemPrompt, userPrompt, options) {
        var settings = readProviderSettings();
        var provider = normalizeCareerProvider(settings.provider);
        var model = String(settings.model || DEFAULT_MODELS[provider] || '').trim();
        var apiKey = String(settings.apiKey || '').trim();
        var maxTokens = Number(options?.maxTokens || 1800);
        var instructionContext = buildProviderInstructionContext(settings);
        if (instructionContext) {
            systemPrompt += '\n\nAdditional provider instructions saved by the user:\n' + instructionContext;
        }
        if (!apiKey) throw new Error('No API key saved for ' + (PROVIDER_LABELS[provider] || provider) + '.');
        if (!model) throw new Error('No model name saved for ' + (PROVIDER_LABELS[provider] || provider) + '.');
        try {
            var proxiedText = await callCareerBackendProxy(provider, model, apiKey, systemPrompt, userPrompt, maxTokens);
            if (proxiedText) return proxiedText;
        } catch (error) {
            if (error?.backendReachable) throw error;
        }
        if (provider === 'openai') {
            var openAiJson = await postCareerJson('https://api.openai.com/v1/responses', {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            }, {
                model: model,
                instructions: systemPrompt,
                input: userPrompt,
                max_output_tokens: maxTokens,
                store: false
            });
            return extractProviderText(provider, openAiJson) || 'OpenAI returned an empty response.';
        }
        if (provider === 'google-gemini') {
            var geminiModel = model.replace(/^models\//, '');
            var geminiJson = await postCareerJson('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(geminiModel) + ':generateContent?key=' + encodeURIComponent(apiKey), {
                'Content-Type': 'application/json'
            }, {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: { temperature: 0.35, maxOutputTokens: maxTokens }
            });
            return extractProviderText(provider, geminiJson) || 'Gemini returned an empty response.';
        }
        var endpoints = {
            'nvidia-nim': 'https://integrate.api.nvidia.com/v1/chat/completions',
            deepseek: 'https://api.deepseek.com/chat/completions',
            openrouter: 'https://openrouter.ai/api/v1/chat/completions'
        };
        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        };
        if (provider === 'openrouter') {
            headers['X-Title'] = 'KIU AI Career Analyst';
            headers['HTTP-Referer'] = window.location.origin || 'http://localhost';
        }
        var chatJson = await postCareerJson(endpoints[provider], headers, {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.35,
            max_tokens: maxTokens,
            stream: false
        });
        return extractProviderText(provider, chatJson) || 'Provider returned an empty response.';
    }
    function buildAgentSystemPrompt(agent) {
        return 'You are the ' + agent.name + ' inside KIU AI Career Analyst. Visible stage: ' + agent.stage + '. Checks: ' + (agent.checks || []).join(', ') + '. Return valid JSON only. Do not use Markdown. Do not include prompt text, scratch notes, hidden reasoning, chain-of-thought, or meta-comments. Do not invent achievements, grades, labor statistics, or university records. JSON schema: ' + JSON.stringify(CAREER_AGENT_JSON_SCHEMA) + '. Keep every array concise and evidence-bound.';
    }
    function buildAgentUserPrompt(agent, priorOutputs) {
        return 'Agent focus:\n' + agent.focus + '\n\nVisible checks:\n' + (agent.checks || []).join(', ') + '\n\nIntake quality:\n' + JSON.stringify(analyzeCareerIntakeQuality()) + '\n\nStudent intake:\n' + buildCareerIntakeText() + '\n\nPrevious agent handoffs:\n' + Object.keys(priorOutputs || {}).map(function(key) {
            return key + ':\n' + priorOutputs[key];
        }).join('\n\n') + '\n\nReturn a concrete handoff for the next agent.';
    }
    function buildParallelAgentPrompt(agent) {
        if (agent.id === 'writer') {
            return 'Parallel report run. Produce only structured JSON for the Report Writer live card. This is not the final report. Do not wait for other agents. Capture final-report risks, missing evidence, and synthesis constraints.\n\nIntake quality:\n' + JSON.stringify(analyzeCareerIntakeQuality()) + '\n\nStudent intake:\n' + buildCareerIntakeText();
        }
        return 'Parallel report run. Focus only on your lane and produce structured JSON. Do not wait for other agents.\n\nAgent focus:\n' + agent.focus + '\n\nVisible checks:\n' + (agent.checks || []).join(', ') + '\n\nIntake quality:\n' + JSON.stringify(analyzeCareerIntakeQuality()) + '\n\nStudent intake:\n' + buildCareerIntakeText();
    }
    function buildProfessionalReportSummary(providerLabel, quality) {
        var data = careerWizardState.data || {};
        var targets = careerHasMeaning(data.targets) ? data.targets : 'No target roles provided';
        if (quality.score < 40) {
            return 'Professional multi-agent assessment generated with ' + providerLabel + '. The profile is not ready for role matching because the intake contains target direction but no supporting evidence.';
        }
        return 'Professional multi-agent assessment generated with ' + providerLabel + ' for ' + targets + '. Recommendations are limited to the evidence supplied by the student.';
    }
    function buildProfessionalReportSections(outputs) {
        var data = careerWizardState.data || {};
        var quality = analyzeCareerIntakeQuality();
        var targets = careerHasMeaning(data.targets) ? data.targets : 'Not provided';
        var faculty = careerHasMeaning(data.faculty) ? data.faculty : getCareerFacultyLabel();
        var hasSkills = [data.technicalSkills, data.softSkills, data.tools].some(careerHasMeaning);
        var hasEvidence = [data.experience, data.portfolio, data.certificates].some(careerHasMeaning) || (careerWizardState.attachedEvidence || []).length > 0;
        var hasAcademics = [data.passedSubjects, data.currentSubjects, data.strongestSubjects].some(careerHasMeaning);
        var hasGoals = [data.goals, data.constraints, data.concerns].some(careerHasMeaning);
        var missing = quality.missing.map(function(item) { return item.label; }).join(', ') || 'No major intake category missing';
        var agentNotes = CAREER_AGENT_PIPELINE.filter(function(agent) {
            return agent.id !== 'writer' && outputs[agent.id];
        }).map(function(agent) {
            var text = cleanAgentOutput(outputs[agent.id]).replace(/\b(PLAN|FINDINGS|HANDOFF)\b[:\s]*/gi, '').replace(/\s+/g, ' ').slice(0, 210);
            return agent.shortName + ': ' + text;
        }).join('\n');
        var readiness = quality.score < 40
            ? 'Not ready for career-path recommendation. This report is a gap assessment, not a job-placement roadmap.'
            : (quality.score < 80 ? 'Partially ready. Recommendations should remain conditional until missing evidence is added.' : 'Ready for a role-specific roadmap.');
        var evidenceBody = [
            'Faculty: ' + faculty + '.',
            'Target roles: ' + targets + '.',
            'Skills evidence: ' + (hasSkills ? 'Provided.' : 'Not provided.'),
            'Experience or portfolio evidence: ' + (hasEvidence ? 'Provided.' : 'Not provided.'),
            'Academic evidence: ' + (hasAcademics ? 'Provided.' : 'Not provided.'),
            'Goals and constraints: ' + (hasGoals ? 'Provided.' : 'Not provided.'),
            'Missing categories: ' + missing + '.'
        ].join('\n');
        return [
            {
                title: 'Executive Decision',
                body: readiness + '\n\nThe student has selected a direction, but the current record does not prove readiness for Business Analyst, Product Manager, or Operations Manager roles. The correct next step is to establish a credible baseline before producing a detailed career path.'
            },
            {
                title: 'Evidence Review',
                body: evidenceBody
            },
            {
                title: 'Role Fit Reality',
                body: 'Business Analyst, Product Manager, and Operations Manager roles require visible proof of tools, coursework, projects, communication ability, and problem-solving. With the current evidence level, the system cannot responsibly claim fit for any of the target roles. The most defensible recommendation is foundational preparation and evidence collection.'
            },
            {
                title: 'Risk Assessment',
                body: 'The main risk is not the selected faculty or target roles. The risk is absence of proof. A general business profile with no tools, no academic record, no projects, and no goals is weak in both traditional hiring and AI-augmented hiring. Any future recommendation must be conditional on added evidence.'
            },
            {
                title: 'Action Plan',
                body: 'Next 7 days: complete the intake with current subjects, passed subjects, tools, language level, and one priority role.\n\nNext 30 days: build baseline proof in Excel, business writing, process mapping, and one role-specific tool.\n\nNext 60-90 days: complete one small portfolio case study tied to the chosen role.\n\nApplication timing: defer applications until at least one credible project, academic proof, or certificate is available.'
            },
            {
                title: 'Required Handoff',
                body: 'Before another full career report, request: transcript or current module list, CV or activity history, tool proficiency, language level, preferred role among the three targets, location/time constraints, and one example of academic or practical work.'
            },
            {
                title: 'Agent Audit Summary',
                body: agentNotes || 'No specialist handoffs were available. The report was produced from the intake only.'
            }
        ];
    }
    function splitLiveReportSections(text) {
        var raw = String(text || '').trim();
        if (!raw) return [];
        var matches = raw.split(/\n(?=(?:#{1,3}\s*)?(?:\d{1,2}[\.\)]\s+|[A-Z][A-Za-z /&-]{4,}:))/g).map(function(part) {
            return part.trim();
        }).filter(Boolean);
        return matches.slice(0, 18).map(function(part, index) {
            var lines = part.split('\n');
            var title = lines.shift() || ('Live section ' + String(index + 1));
            title = title.replace(/^#{1,3}\s*/, '').replace(/:$/, '').trim();
            return { title: title || ('Live section ' + String(index + 1)), body: lines.join('\n').trim() || part };
        });
    }
    function buildCareerScoreSnapshot() {
        var data = careerWizardState.data || {};
        var quality = analyzeCareerIntakeQuality();
        var hasSkills = [data.technicalSkills, data.softSkills, data.tools].some(careerHasMeaning);
        var hasEvidence = [data.experience, data.portfolio, data.certificates, data.passedSubjects, data.currentSubjects].some(careerHasMeaning) || (careerWizardState.attachedEvidence || []).length > 0;
        var hasGoals = [data.targets, data.goals, data.constraints, data.concerns].some(careerHasMeaning);
        var evidenceScore = hasEvidence ? 70 : 32;
        var readinessScore = Math.min(86, Math.max(quality.score, 22 + (hasSkills ? 22 : 0) + (hasEvidence ? 18 : 0) + (hasGoals ? 10 : 0)));
        var confidence = hasSkills && hasEvidence && hasGoals ? 'Medium' : 'Low';
        return [
            [String(readinessScore) + '/100', 'Current readiness estimate'],
            [String(evidenceScore) + '/100', 'Evidence strength'],
            [confidence, 'Recommendation confidence']
        ];
    }
    function buildFinalEditorSystemPrompt() {
        return 'You are the Chief Report Editor for KIU AI Career Analyst. Return valid JSON only. Do not use Markdown. Do not repeat prompt text. Do not expose hidden reasoning. Do not invent data. Produce a professional student-facing report from structured agent findings. JSON schema: {"summary":"short professional summary","sections":[{"title":"section title","body":"plain text body"}],"qualityNotes":["quality gate note"]}. Required section titles: ' + CAREER_REPORT_SECTION_TITLES.join(', ') + '.';
    }
    function buildFinalEditorPrompt(structuredOutputs) {
        return JSON.stringify({
            intakeQuality: analyzeCareerIntakeQuality(),
            studentIntake: buildCareerIntakeText(),
            requiredSections: CAREER_REPORT_SECTION_TITLES,
            agentFindings: structuredOutputs
        });
    }
    function normalizeEditorReport(raw, providerLabel, fallbackOutputs) {
        var json = extractJsonObject(raw);
        var fallback = {
            summary: buildProfessionalReportSummary(providerLabel, analyzeCareerIntakeQuality()),
            scores: buildCareerScoreSnapshot(),
            sections: buildProfessionalReportSections(fallbackOutputs || {}),
            qualityNotes: ['Fallback deterministic report used because editor response was not valid structured JSON.']
        };
        if (!json || typeof json !== 'object') return fallback;
        var sections = normalizeStringArray([], 0);
        if (Array.isArray(json.sections)) {
            sections = json.sections.map(function(section) {
                return {
                    title: String(section?.title || '').trim(),
                    body: String(section?.body || '').trim()
                };
            }).filter(function(section) { return section.title && section.body; }).slice(0, 10);
        }
        var requiredMap = sections.reduce(function(acc, section) {
            acc[section.title.toLowerCase()] = true;
            return acc;
        }, {});
        var fallbackSections = buildProfessionalReportSections(fallbackOutputs || {});
        CAREER_REPORT_SECTION_TITLES.forEach(function(title) {
            if (!requiredMap[title.toLowerCase()]) {
                var fallbackSection = fallbackSections.find(function(section) { return section.title === title; });
                if (fallbackSection) sections.push(fallbackSection);
            }
        });
        return {
            summary: String(json.summary || fallback.summary).trim(),
            scores: buildCareerScoreSnapshot(),
            sections: sections.length ? sections : fallback.sections,
            qualityNotes: normalizeStringArray(json.qualityNotes, 8),
            audit: buildReportAudit()
        };
    }
    function buildReportAudit() {
        var settings = readProviderSettings();
        var run = careerWizardState.agentRun || {};
        return {
            provider: PROVIDER_LABELS[settings.provider] || settings.provider || 'Provider',
            model: settings.model || '',
            generatedAt: new Date().toISOString(),
            intakeScore: analyzeCareerIntakeQuality().score,
            attempts: run.attempts || {},
            providerHealth: run.providerHealth || {},
            diagnosticMode: Boolean(run.diagnosticMode),
            finalEditor: run.finalEditor || 'idle'
        };
    }
    function runReportQualityGate(report) {
        var text = [
            report?.summary || '',
            ...(report?.sections || []).map(function(section) { return (section.title || '') + '\n' + (section.body || ''); })
        ].join('\n');
        var issues = [];
        if (/PLAN\s*\$?\\?rightarrow|PLAN\s*->\s*FINDINGS|Under 450 words|Parallel report run|Return valid JSON|system prompt|Do not repeat this instruction/i.test(text)) {
            issues.push('Prompt scaffolding detected.');
        }
        if ((text.match(/\bPLAN\b/gi) || []).length > 1) issues.push('Repeated PLAN blocks detected.');
        if ((report?.sections || []).length < 5) issues.push('Report has too few sections.');
        if (!String(report?.summary || '').trim()) issues.push('Missing summary.');
        return { ok: issues.length === 0, issues: issues };
    }
    function buildReportFromAgentOutputs(outputs, finalText, providerLabel) {
        var quality = analyzeCareerIntakeQuality();
        return {
            summary: buildProfessionalReportSummary(providerLabel, quality),
            scores: buildCareerScoreSnapshot(),
            sections: buildProfessionalReportSections(outputs)
        };
    }
    async function runCareerAgentWorkflow() {
        var settings = readProviderSettings();
        careerWizardState.agentRun = careerWizardState.agentRun || createAgentRunState(settings);
        careerWizardState.agentRun.running = true;
        careerWizardState.agentRun.provider = settings.provider;
        careerWizardState.agentRun.model = settings.model;
        renderWizardStep();
        if (!settings.apiKey || !settings.model) {
            careerWizardState.agentRun.running = false;
            careerWizardState.agentRun.error = 'Provider settings are required before the agents can run. Add an API key and model, then generate the report again.';
            setAgentStatus('coordinator', 'error');
            pushAgentLog(CAREER_AGENT_PIPELINE[0], 'Provider required', careerWizardState.agentRun.error);
            renderWizardStep();
            openProviderSettings();
            return;
        }
        var intakeQuality = analyzeCareerIntakeQuality();
        if (intakeQuality.score < 40) {
            careerWizardState.agentRun.diagnosticMode = true;
            pushAgentLog(CAREER_AGENT_PIPELINE[0], 'Diagnostic mode', 'Intake score is ' + intakeQuality.score + '%. Running evidence diagnostic before full roadmap.');
        }
        var outputs = {};
        CAREER_AGENT_PIPELINE.forEach(function(agent) {
            setAgentStatus(agent.id, 'active');
            pushAgentLog(agent, 'Parallel start', agent.stage + ': ' + agent.focus);
            pushAgentLog(agent, 'Checking now', (agent.checks || []).join(', '));
        });
        var results = await Promise.all(CAREER_AGENT_PIPELINE.map(async function(agent) {
            try {
                var maxTokens = agent.id === 'writer' ? 2600 : 1600;
                await waitCareer(700);
                var output = await callCareerProviderWithRetry(buildAgentSystemPrompt(agent), buildParallelAgentPrompt(agent), { maxTokens: maxTokens, attempts: 5, retryDelayMs: 5000, agent: agent });
                var parsed = parseAgentProviderOutput(agent, output);
                careerWizardState.agentRun.structured[agent.id] = parsed.structured;
                careerWizardState.agentRun.outputs[agent.id] = parsed.displayText;
                await revealAgentWords(agent, parsed.displayText);
                setAgentStatus(agent.id, 'done');
                pushAgentLog(agent, 'Structured handoff complete', parsed.displayText);
                return { agent: agent, output: parsed.displayText, structured: parsed.structured };
            } catch (error) {
                var message = providerErrorMessage(settings.provider, error);
                setAgentStatus(agent.id, 'error');
                pushAgentLog(agent, 'Provider error', message);
                return { agent: agent, error: message };
            }
        }));
        results.forEach(function(result) {
            outputs[result.agent.id] = result.output || result.error || '';
        });
        if (results.every(function(result) { return !result.output; })) {
            careerWizardState.agentRun.running = false;
            careerWizardState.agentRun.error = 'All six provider requests failed. Check provider status or try another model.';
            renderWizardStep();
            return;
        }
        careerWizardState.agentRun.running = false;
        careerWizardState.agentRun.finalEditor = 'running';
        renderWizardStep();
        var providerLabel = PROVIDER_LABELS[settings.provider] || 'provider';
        var report = null;
        try {
            var editorText = await callCareerProviderWithRetry(
                buildFinalEditorSystemPrompt(),
                buildFinalEditorPrompt(careerWizardState.agentRun.structured || {}),
                { maxTokens: 3200, attempts: 5, retryDelayMs: 5000 }
            );
            report = normalizeEditorReport(editorText, providerLabel, outputs);
            var gate = runReportQualityGate(report);
            if (!gate.ok) {
                var fallback = buildReportFromAgentOutputs(outputs, outputs.writer, providerLabel);
                fallback.qualityNotes = gate.issues.concat(['Provider editor output was replaced by deterministic report builder.']);
                report = fallback;
            }
        } catch (error) {
            report = buildReportFromAgentOutputs(outputs, outputs.writer, providerLabel);
            report.qualityNotes = ['Final editor provider call failed: ' + (error?.message || 'unknown error') + '. Deterministic report builder used.'];
        }
        careerWizardState.agentRun.finalEditor = 'done';
        if (intakeQuality.score < 40) {
            var diagnostic = buildWeakIntakeDiagnostic();
            diagnostic.qualityNotes = (diagnostic.qualityNotes || []).concat(report.qualityNotes || []);
            diagnostic.audit = buildReportAudit();
            report = diagnostic;
        }
        if (report && !report.audit) report.audit = buildReportAudit();
        careerWizardState.report = report;
        saveCareerReport(careerWizardState.report);
        renderWizardStep();
        persistCareerDraft();
    }
    async function sendCareerChatMessage(value) {
        appendMessage(value, 'user');
        saveCareerHistory(value, 'chat', { message: value });
        var settings = readProviderSettings();
        var quality = analyzeCareerIntakeQuality();
        var system = 'You are KIU AI Career Analyst. Normal chat mode, not report-agent mode. Do not reveal hidden chain-of-thought, scratch planning, or bullet notes about what the user provided. Answer as a serious career advisor. Be concise, practical, evidence-bound, and polite. If the message is only a greeting, greet briefly and ask for the next useful career detail. If the intake is weak, ask for at most three missing items instead of writing a long roadmap. If provider configuration is missing, explain exactly what is missing.';
        var user = 'Current intake quality: ' + quality.level + ' (' + quality.score + '%). Missing: ' + quality.missing.map(function(item) { return item.label; }).join(', ') + '.\n\nCurrent intake:\n' + buildCareerIntakeText() + '\n\nUser message:\n' + value;
        try {
            var answer = settings.apiKey && settings.model
                ? await callCareerProviderWithRetry(system, user, { maxTokens: 1200, attempts: 5, retryDelayMs: 5000 })
                : 'Provider key or model is missing. Save provider settings first, then I can answer through the selected real model.';
            appendMessage(answer, 'assistant');
        } catch (error) {
            appendMessage(providerErrorMessage(settings.provider, error), 'assistant');
        }
    }
    function loadCareerDraft() {
        careerWizardState.data.faculty = getCareerFacultyLabel();
        careerWizardState.attachedEvidence = readCareerArray(CAREER_EVIDENCE_KEY);
        try {
            var draft = JSON.parse(localStorage.getItem(CAREER_INTAKE_DRAFT_KEY) || '{}');
            Object.keys(careerWizardState.data).forEach(function(key) {
                if (draft[key]) careerWizardState.data[key] = String(draft[key] || '');
            });
            careerWizardState.data.faculty = draft.faculty || getCareerFacultyLabel();
        } catch (error) {}
    }
    function renderStepper() {
        var stepper = document.getElementById('career-stepper');
        if (!stepper) return;
        stepper.innerHTML = WIZARD_STEPS.map(function(step, index) {
            var state = index === careerWizardState.step ? ' is-active' : (index < careerWizardState.step ? ' is-done' : '');
            var icon = index < careerWizardState.step ? 'fas fa-check' : 'fas fa-circle';
            return '<button class="career-step-dot' + state + '" type="button" data-step-index="' + index + '"><i class="career-step-icon ' + icon + '"></i><span class="career-step-label">' + escapeCareerHtml(step.label) + '</span></button>';
        }).join('');
        stepper.querySelectorAll('[data-step-index]').forEach(function(button) {
            button.addEventListener('click', function() {
                collectCurrentStepData();
                careerWizardState.step = Number(button.getAttribute('data-step-index')) || 0;
                renderWizardStep();
            });
        });
    }
    function renderReview() {
        var data = careerWizardState.data;
        var items = [
            ['Faculty', data.faculty],
            ['Profession area', data.profession],
            ['Target roles', data.targets],
            ['Technical/domain skills', data.technicalSkills],
            ['Soft skills/languages', data.softSkills],
            ['Tools/platforms', data.tools],
            ['Experience/projects', data.experience],
            ['Portfolio links', data.portfolio],
            ['Subjects', [data.passedSubjects, data.currentSubjects, data.strongestSubjects].filter(Boolean).join('\n')],
            ['Goals and constraints', [data.goals, data.constraints, data.concerns].filter(Boolean).join('\n')]
        ];
        return '<div class="career-review-grid">' + items.map(function(item) {
            return '<div class="career-review-item"><strong class="career-review-item-label">' + escapeCareerHtml(item[0]) + '</strong><span class="career-review-item-value">' + escapeCareerHtml(item[1] || 'Not provided yet') + '</span></div>';
        }).join('') + '</div>' +
        '<div class="career-agent-mini">' +
            '<div class="career-agent-mini-card"><strong class="career-agent-mini-title">Coordinator</strong><span class="career-agent-mini-copy">Splits work and checks missing factors.</span></div>' +
            '<div class="career-agent-mini-card"><strong class="career-agent-mini-title">Fit analyst</strong><span class="career-agent-mini-copy">Ranks realistic paths from evidence.</span></div>' +
            '<div class="career-agent-mini-card"><strong class="career-agent-mini-title">Market analyst</strong><span class="career-agent-mini-copy">Checks trends, demand, and AI risk.</span></div>' +
            '<div class="career-agent-mini-card"><strong class="career-agent-mini-title">Roadmap analyst</strong><span class="career-agent-mini-copy">Finds gaps and next actions.</span></div>' +
        '</div>';
    }
    function renderReport() {
        if (!careerWizardState.report && careerWizardState.agentRun?.running) {
            return renderAgentConsoleHtml() +
                '<div class="career-section-note career-report-status-note career-report-status-note--running">The agents are running now. Their planning, writing, and handoffs will appear here as each step completes.</div>';
        }
        if (!careerWizardState.report && careerWizardState.agentRun?.error) {
            return renderAgentConsoleHtml() +
                '<div class="career-section-note career-report-status-note career-report-status-note--error">' + escapeCareerHtml(careerWizardState.agentRun.error) + '</div>' +
                '<button class="career-primary-action career-report-provider-open-btn" type="button" id="career-report-provider-open"><i class="fas fa-key"></i> Open provider settings</button>';
        }
        if (!careerWizardState.report) {
            return '<div class="career-section-note career-report-status-note career-report-status-note--empty">Connect a provider, complete the intake, and generate the report. The page will not create a report without a real model response.</div>' +
                '<button class="career-primary-action career-report-provider-open-btn" type="button" id="career-report-provider-open"><i class="fas fa-key"></i> Open provider settings</button>';
        }
        var report = careerWizardState.report;
        return renderAgentConsoleHtml() + renderReportDocument(report);
    }
    function renderReportDocument(report) {
        report = report || {};
        var qualityNotes = (report.qualityNotes || []).length
            ? '<section class="career-report-section career-report-section--quality"><h3 class="career-report-section-title">Quality Gate</h3><p class="career-report-section-copy">' + escapeCareerHtml((report.qualityNotes || []).join('\n')) + '</p></section>'
            : '';
        var audit = report.audit
            ? '<section class="career-report-section career-report-section--audit"><h3 class="career-report-section-title">Audit Trail</h3><p class="career-report-section-copy">' + escapeCareerHtml([
                'Provider: ' + (report.audit.provider || 'not recorded'),
                'Model: ' + (report.audit.model || 'not recorded'),
                'Generated: ' + (report.audit.generatedAt || 'not recorded'),
                'Intake score: ' + String(report.audit.intakeScore ?? 'not recorded'),
                'Diagnostic mode: ' + (report.audit.diagnosticMode ? 'yes' : 'no')
            ].join('\n')) + '</p></section>'
            : '';
        var sectionHtml = (report.sections || []).map(function(section) {
            var body = section.table
                ? '<div class="career-report-table-wrap"><table class="career-report-table"><thead><tr class="career-report-table-row career-report-table-row--head">' +
                    (section.tableHeaders || ['Career path', 'Fit', 'Demand', 'Entry difficulty', 'AI risk', 'Time to employability']).map(function(header) {
                        return '<th class="career-report-table-head-cell">' + escapeCareerHtml(header) + '</th>';
                    }).join('') +
                  '</tr></thead><tbody>' +
                    section.table.map(function(row) {
                        return '<tr class="career-report-table-row">' + row.map(function(cell) { return '<td class="career-report-table-cell">' + escapeCareerHtml(cell) + '</td>'; }).join('') + '</tr>';
                    }).join('') +
                  '</tbody></table></div>'
                : '<p class="career-report-section-copy">' + escapeCareerHtml(section.body || '') + '</p>';
            return '<section class="career-report-section"><h3 class="career-report-section-title">' + escapeCareerHtml(section.title || '') + '</h3>' + body + '</section>';
        }).join('') + qualityNotes + audit;
        return '<div class="career-section-note career-report-status-note career-report-summary-note">' + escapeCareerHtml(report.summary || '') + '</div>' +
            '<div class="career-report-grid career-report-score-grid">' + (report.scores || []).map(function(score) {
                return '<div class="career-score-box career-report-score-card"><strong class="career-score-box-label">' + escapeCareerHtml(score[0]) + '</strong><span class="career-score-box-value">' + escapeCareerHtml(score[1]) + '</span></div>';
            }).join('') + '</div>' +
            '<div class="career-report-document">' + sectionHtml + '</div>';
    }
    function renderChatWorkspace() {
        var showAgentPreview = !careerWizardState.agentRun && !careerWizardState.report && (WIZARD_STEPS[careerWizardState.step] || {}).key !== 'report';
        return '<div class="career-report-workspace">' +
            '<div class="career-workspace-hero lux-hero-stage">' +
                '<div class="lux-hero-main career-workspace-hero-main">' +
                    '<div class="career-kicker">Agentic career system</div>' +
                    '<div class="career-workspace-title">Six agents inspect the same student profile from different angles.</div>' +
                    '<div class="career-workspace-copy">The Coordinator routes work first. Evidence, Market, AI Risk, Roadmap, and Writer agents then expose what they check, what they found, and what they hand off.</div>' +
                '</div>' +
                '<div class="career-workspace-badge career-workspace-badge-card lux-strip-card surface-card"><i class="fas fa-users-gear"></i> 6-agent workflow</div>' +
            '</div>' +
            renderIntakeQualityPanel() +
            (showAgentPreview ? '<div class="career-agent-console" id="career-agent-preview">' + renderAgentConsoleInner() + '</div>' : '') +
            '<div class="career-wizard-stage" id="career-wizard-stage" aria-live="polite">' +
                '<div class="career-stepper" id="career-stepper" aria-label="Career report progress"></div>' +
                '<section class="career-wizard-card" id="career-wizard-card"></section>' +
            '</div>' +
        '</div>';
    }
    function renderReportsWorkspace() {
        var reports = readCareerArray(CAREER_REPORTS_KEY);
        var cards = reports.length ? reports.map(function(report, index) {
            return '<button class="career-history-item career-report-saved-item" type="button" data-career-report-index="' + index + '">' +
                '<div class="career-report-saved-title">' + escapeCareerHtml(report.summary || 'Career report') + '</div>' +
                '<div class="career-report-saved-date">' + escapeCareerHtml(formatCareerDate(report.createdAt)) + '</div>' +
            '</button>';
        }).join('') : '<div class="career-section-note career-report-empty-note">No provider-generated reports are saved yet.</div>';
        return '<div class="career-report-workspace">' +
            '<div class="career-workspace-hero lux-hero-stage">' +
                '<div class="lux-hero-main career-workspace-hero-main">' +
                    '<div class="career-kicker">Reports</div>' +
                    '<div class="career-workspace-title">Saved AI career reports</div>' +
                    '<div class="career-workspace-copy">Only reports generated by a configured provider are listed here.</div>' +
                '</div>' +
                '<button class="career-primary-action career-reports-new-btn" type="button" id="career-reports-new"><i class="fas fa-file-circle-plus"></i> New report</button>' +
            '</div>' +
            '<div class="career-report-saved-stream">' + cards + '</div>' +
        '</div>';
    }
    function renderVacanciesWorkspace() {
        var latest = readCareerArray(CAREER_VACANCIES_KEY)[0];
        return '<div class="career-report-workspace">' +
            '<div class="career-workspace-hero lux-hero-stage">' +
                '<div class="lux-hero-main career-workspace-hero-main">' +
                    '<div class="career-kicker">Vacancy intelligence</div>' +
                    '<div class="career-workspace-title">Match the intake against real hiring language.</div>' +
                    '<div class="career-workspace-copy">The selected provider reads the current intake and returns job titles, search keywords, weak points, and application priorities.</div>' +
                '</div>' +
                '<button class="career-primary-action career-vacancy-run-btn" type="button" id="career-run-vacancy-intel"><i class="fas fa-radar"></i> Analyze vacancies</button>' +
            '</div>' +
            '<div class="career-report-document career-vacancy-output-shell" id="career-vacancy-output">' +
                (latest ? '<section class="career-report-section career-vacancy-section"><h3 class="career-report-section-title">Latest vacancy intelligence</h3><p class="career-report-section-copy">' + escapeCareerHtml(latest.text || '') + '</p></section>' : '<div class="career-section-note career-vacancy-empty-note">Run vacancy intelligence with a configured provider to generate this view.</div>') +
            '</div>' +
        '</div>';
    }
    function wireReportsWorkspace() {
        document.getElementById('career-reports-new')?.addEventListener('click', function() {
            if (!careerWizardState.report && !careerWizardState.agentRun && careerWizardState.step === 0 && careerWizardState.currentView === 'chat') {
                return;
            }
            careerWizardState.report = null;
            careerWizardState.agentRun = null;
            careerWizardState.step = 0;
            setCareerView('chat');
        });
        document.querySelectorAll('[data-career-report-index]').forEach(function(button) {
            button.addEventListener('click', function() {
                var report = readCareerArray(CAREER_REPORTS_KEY)[Number(button.getAttribute('data-career-report-index')) || 0];
                if (!report) return;
                if (careerWizardState.report === report && careerWizardState.step === WIZARD_STEPS.length - 1 && careerWizardState.currentView === 'chat') {
                    return;
                }
                careerWizardState.report = report;
                careerWizardState.step = WIZARD_STEPS.length - 1;
                setCareerView('chat');
            });
        });
    }
    async function runVacancyIntelligence() {
        var output = document.getElementById('career-vacancy-output');
        var button = document.getElementById('career-run-vacancy-intel');
        var settings = readProviderSettings();
        if (!settings.apiKey || !settings.model) {
            if (output) output.innerHTML = '<div class="career-section-note career-vacancy-empty-note career-vacancy-status-note career-vacancy-status-note--settings">Provider settings are required before vacancy intelligence can run.</div><button class="career-primary-action career-vacancy-provider-open-btn" type="button" id="career-vacancy-provider-open"><i class="fas fa-key"></i> Open provider settings</button>';
            document.getElementById('career-vacancy-provider-open')?.addEventListener('click', openProviderSettings);
            openProviderSettings();
            return;
        }
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing';
        }
        if (output) output.innerHTML = '<div class="career-section-note career-vacancy-empty-note career-vacancy-status-note career-vacancy-status-note--running">Provider is analyzing roles, keywords, application filters, and risk signals from the current intake.</div>';
        try {
            var text = await callCareerProvider(
                'You are KIU Vacancy Intelligence. Return a professional hiring-market analysis from the provided student intake. Do not invent live job postings. Produce job titles to search, keywords, filters, portfolio requirements, rejection risks, and a first application plan.',
                'Current intake:\n' + buildCareerIntakeText(),
                { maxTokens: 1800 }
            );
            var item = { text: text, createdAt: new Date().toISOString() };
            var items = readCareerArray(CAREER_VACANCIES_KEY);
            items.unshift(item);
            writeCareerArray(CAREER_VACANCIES_KEY, items, 5);
            saveCareerHistory('Vacancy intelligence: ' + (careerWizardState.data.targets || careerWizardState.data.profession || 'career market'), 'vacancies', item);
            if (output) output.innerHTML = '<section class="career-report-section career-vacancy-section"><h3 class="career-report-section-title">Vacancy intelligence</h3><p class="career-report-section-copy">' + escapeCareerHtml(text) + '</p></section>';
        } catch (error) {
            if (output) output.innerHTML = '<div class="career-section-note career-vacancy-empty-note career-vacancy-status-note career-vacancy-status-note--error">' + escapeCareerHtml(providerErrorMessage(settings.provider, error)) + '</div>';
        } finally {
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-radar"></i> Analyze vacancies';
            }
        }
    }
    function wireVacanciesWorkspace() {
        document.getElementById('career-run-vacancy-intel')?.addEventListener('click', runVacancyIntelligence);
    }
    function setCareerView(view) {
        var nextView = ['chat', 'reports', 'vacancies'].includes(view) ? view : 'chat';
        if (careerWizardState.currentView === nextView) {
            return;
        }
        careerWizardState.currentView = nextView;
        document.querySelectorAll('[data-career-view]').forEach(function(button) {
            button.classList.toggle('is-active', button.getAttribute('data-career-view') === nextView);
        });
        var empty = document.getElementById('career-empty-state');
        var list = document.getElementById('career-message-list');
        if (!empty || !list) return;
        if (nextView === 'chat') {
            setElementShown(list, true);
            empty.innerHTML = renderChatWorkspace();
            var forceWorkspace = Boolean(careerWizardState.report || careerWizardState.agentRun || (WIZARD_STEPS[careerWizardState.step] || {}).key === 'review' || (WIZARD_STEPS[careerWizardState.step] || {}).key === 'report');
            setElementShown(empty, forceWorkspace || !list.classList.contains('has-messages'));
            renderWizardStep();
            return;
        }
        setElementShown(list, false);
        setElementShown(empty, true);
        empty.innerHTML = nextView === 'reports' ? renderReportsWorkspace() : renderVacanciesWorkspace();
        if (nextView === 'reports') wireReportsWorkspace();
        if (nextView === 'vacancies') wireVacanciesWorkspace();
    }
    function stepFields(stepKey) {
        if (stepKey === 'profile') {
            return '<div class="career-wizard-fields two-col">' +
                fieldHtml('faculty', 'Faculty', { type: 'input', readonly: true, wide: false }) +
                fieldHtml('profession', 'Profession area', { type: 'select', wide: false, choices: ['Management and Business', 'Computer Science', 'Economics and Finance', 'Law', 'Medicine'] }) +
                fieldHtml('targets', 'Target roles you want to analyze', { type: 'input', placeholder: 'Example: product manager, business analyst, operations manager' }) +
                '</div>';
        }
        if (stepKey === 'skills') {
            return '<div class="career-wizard-fields">' +
                fieldHtml('technicalSkills', 'Technical or domain skills', { placeholder: 'Skills you can explain, use, or demonstrate.' }) +
                fieldHtml('softSkills', 'Soft skills and languages', { placeholder: 'Communication, leadership, Georgian/English/Russian, teamwork, presentation, negotiation.' }) +
                fieldHtml('tools', 'Tools and platforms', { placeholder: 'Excel, SQL, Power BI, Python, Figma, Jira, CRM, Git, etc.' }) +
                '</div>';
        }
        if (stepKey === 'evidence') {
            return '<div class="career-wizard-fields">' +
                fieldHtml('experience', 'Experience, projects, or real examples', { placeholder: 'Internships, jobs, university projects, competitions, volunteering, freelance work.' }) +
                fieldHtml('portfolio', 'Portfolio links', { placeholder: 'GitHub, LinkedIn, Behance, Social portfolio page, project URLs.' }) +
                fieldHtml('certificates', 'Certificates or credentials', { placeholder: 'Courses, certificates, awards, exams, licenses.' }) +
                '</div>';
        }
        if (stepKey === 'subjects') {
            return '<div class="career-wizard-fields">' +
                fieldHtml('passedSubjects', 'Passed subjects', { placeholder: 'Subjects already completed that matter for career analysis.' }) +
                fieldHtml('currentSubjects', 'Current subjects', { placeholder: 'Subjects you are studying now.' }) +
                fieldHtml('strongestSubjects', 'Strongest and weakest subjects', { placeholder: 'Be honest. This affects confidence and roadmap.' }) +
                '</div>';
        }
        if (stepKey === 'goals') {
            return '<div class="career-wizard-fields">' +
                fieldHtml('goals', 'Career goals', { placeholder: 'What kind of work do you want and why?' }) +
                fieldHtml('constraints', 'Constraints', { placeholder: 'Location, remote/local, salary, schedule, family, financial pressure, time to learn.' }) +
                fieldHtml('concerns', 'Concerns and risks', { placeholder: 'AI replacement, competition, weak skills, low confidence, lack of experience.' }) +
                '</div>';
        }
        if (stepKey === 'review') return renderReview();
        return renderReport();
    }
    function renderWizardStep() {
        var card = document.getElementById('career-wizard-card');
        if (!card) return;
        var step = WIZARD_STEPS[careerWizardState.step] || WIZARD_STEPS[0];
        var isFirst = careerWizardState.step === 0;
        var isReview = step.key === 'review';
        var isReport = step.key === 'report';
        card.classList.toggle('is-report', isReport);
        renderStepper();
        card.innerHTML =
            '<div class="career-wizard-head">' +
                '<div class="career-step-count">Step ' + String(careerWizardState.step + 1) + ' of ' + String(WIZARD_STEPS.length) + '</div>' +
                '<div class="career-wizard-title">' + escapeCareerHtml(step.title) + '</div>' +
                '<div class="career-wizard-copy">' + escapeCareerHtml(step.copy) + '</div>' +
            '</div>' +
            stepFields(step.key) +
            '<div class="career-wizard-actions">' +
                '<button class="career-secondary-action career-wizard-save-draft-btn" type="button" id="career-save-draft"><i class="fas fa-floppy-disk"></i> Save draft</button>' +
                '<div class="career-wizard-actions-main">' +
                    '<button class="career-secondary-action career-wizard-back-btn" type="button" id="career-step-back"' + (isFirst ? ' disabled' : '') + '><i class="fas fa-arrow-left"></i> Back</button>' +
                    '<button class="career-primary-action career-wizard-next-btn" type="button" id="career-step-next"><i class="fas ' + (isReview ? 'fa-wand-magic-sparkles' : (isReport ? 'fa-pen-to-square' : 'fa-arrow-right')) + '"></i> ' + (isReview ? 'Generate report' : (isReport ? 'Edit intake' : 'Continue')) + '</button>' +
                '</div>' +
            '</div>';
        wireAgentConsoleTabs(card);
        document.getElementById('career-save-draft')?.addEventListener('click', function() {
            collectCurrentStepData();
            var button = this;
            var original = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Draft saved';
            setTimeout(function() { button.innerHTML = original; }, 1200);
        });
        document.getElementById('career-step-back')?.addEventListener('click', function() {
            collectCurrentStepData();
            var nextStep = Math.max(0, careerWizardState.step - 1);
            if (nextStep === careerWizardState.step) return;
            careerWizardState.step = nextStep;
            renderWizardStep();
        });
        document.getElementById('career-step-next')?.addEventListener('click', function() {
            collectCurrentStepData();
            if (isReport) {
                careerWizardState.step = 0;
                renderWizardStep();
                return;
            }
            if (isReview) {
                careerWizardState.report = null;
                careerWizardState.agentRun = createAgentRunState(readProviderSettings());
                careerWizardState.step = WIZARD_STEPS.length - 1;
                setCareerView('chat');
                renderWizardStep();
                runCareerAgentWorkflow();
                return;
            }
            var nextStep = Math.min(WIZARD_STEPS.length - 1, careerWizardState.step + 1);
            if (nextStep === careerWizardState.step) return;
            careerWizardState.step = nextStep;
            renderWizardStep();
        });
        document.getElementById('career-report-provider-open')?.addEventListener('click', openProviderSettings);
        document.querySelector('[data-career-field="profession"]')?.addEventListener('change', function(event) {
            careerWizardState.data.profession = String(event.target.value || '');
            var roles = ROLE_BLUEPRINTS[careerWizardState.data.profession] || [];
            if (!careerWizardState.data.targets) {
                careerWizardState.data.targets = roles.slice(0, 3).join(', ');
                renderWizardStep();
            }
        });
    }
    function setupCareerWorkflow() {
        loadCareerDraft();
        setCareerView('chat');
        renderCareerHistory();
    }
    function setupProviderSettings() {
        document.getElementById('career-provider-settings')?.addEventListener('click', openProviderSettings);
        document.getElementById('career-tool-info')?.addEventListener('click', openToolInfo);
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeProviderSettings();
                closeInstructionsStudio();
                closeToolInfo();
            }
        });
        applyProviderSettings(readProviderSettings());
    }
    function readEvidenceUploadFile(file) {
        return new Promise(function(resolve) {
            var meta = {
                name: file.name || 'evidence',
                type: file.type || 'unknown file',
                size: file.size || 0,
                summary: ''
            };
            var isText = /text|json|markdown/i.test(file.type || '') || /\.(txt|md|json)$/i.test(file.name || '');
            if (!isText || file.size > 240000) {
                meta.summary = 'Attached as file metadata for the AI intake.';
                resolve(meta);
                return;
            }
            var reader = new FileReader();
            reader.onload = function() {
                var content = String(reader.result || '').slice(0, 12000);
                meta.summary = content.slice(0, 500) || 'Text evidence attached.';
                meta.content = content;
                resolve(meta);
            };
            reader.onerror = function() {
                meta.summary = 'File could not be read, metadata attached.';
                resolve(meta);
            };
            reader.readAsText(file);
        });
    }
    async function handleEvidenceFiles(files) {
        var picked = Array.from(files || []).slice(0, 6);
        if (!picked.length) return;
        var items = await Promise.all(picked.map(readEvidenceUploadFile));
        careerWizardState.attachedEvidence = items.concat(careerWizardState.attachedEvidence || []).slice(0, 12);
        writeCareerArray(CAREER_EVIDENCE_KEY, careerWizardState.attachedEvidence, 12);
        appendMessage('Attached evidence: ' + items.map(function(item) { return item.name; }).join(', '), 'assistant');
        saveCareerHistory('Attached evidence: ' + items.map(function(item) { return item.name; }).join(', '), 'evidence', { files: items });
    }
    function setupComposer() {
        var input = document.getElementById('career-message-input');
        document.querySelectorAll('[data-career-view]').forEach(function(button) {
            button.addEventListener('click', function() {
                setCareerView(button.getAttribute('data-career-view'));
            });
        });
        document.querySelectorAll('[data-prompt]').forEach(function(button) {
            button.addEventListener('click', function() {
                if (!input) return;
                input.value = button.getAttribute('data-prompt') || '';
                input.focus();
            });
        });
        document.getElementById('career-new-chat')?.addEventListener('click', function() {
            setCareerView('chat');
            var list = document.getElementById('career-message-list');
            var empty = document.getElementById('career-empty-state');
            if (list) {
                list.innerHTML = '';
                list.classList.remove('has-messages');
            }
            careerWizardState.step = 0;
            careerWizardState.report = null;
            renderWizardStep();
            setElementShown(empty, true);
            if (input) input.value = '';
        });
        document.getElementById('career-attach-evidence')?.addEventListener('click', function() {
            document.getElementById('career-evidence-upload')?.click();
        });
        document.getElementById('career-evidence-upload')?.addEventListener('change', function(event) {
            handleEvidenceFiles(event.target.files || []);
            event.target.value = '';
        });
        document.querySelector('.career-composer-tool.is-report')?.addEventListener('click', function() {
            collectCurrentStepData();
            careerWizardState.step = WIZARD_STEPS.findIndex(function(step) { return step.key === 'review'; });
            if (careerWizardState.step < 0) careerWizardState.step = WIZARD_STEPS.length - 2;
            setCareerView('chat');
        });
        document.getElementById('career-composer')?.addEventListener('submit', function(event) {
            event.preventDefault();
            var value = String(input?.value || '').trim();
            if (!value) return;
            input.value = '';
            sendCareerChatMessage(value);
        });
    }
    function init() {
        setupMobileNav();
        setupProviderSettings();
        setupCareerWorkflow();
        setupComposer();
        window.__kiuCareerDebug = {
            appendMessage: appendMessage,
            setCareerView: setCareerView,
            openProviderSettings: openProviderSettings,
            closeProviderSettings: closeProviderSettings
        };
        buildRoleNav();
        onResize();
        syncActive('career-market');
        window.addEventListener('resize', onResize);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();

