$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"

$bottomNav = @'

<!-- MOBILE BOTTOM NAVIGATION -->
<nav id="mobile-bottom-nav" aria-label="Mobile navigation" style="display:none;">
    <button class="mobile-nav-btn is-active" data-nav-target="home" type="button" id="mob-nav-home">
        <i class="fas fa-th-large"></i><span>Home</span>
    </button>
    <button class="mobile-nav-btn" data-nav-target="lms" type="button" id="mob-nav-lms">
        <i class="fas fa-book-reader"></i><span>LMS</span>
    </button>
    <button class="mobile-nav-btn" data-nav-target="timetable" type="button" id="mob-nav-timetable">
        <i class="fas fa-calendar-week"></i><span>Schedule</span>
    </button>
    <button class="mobile-nav-btn" data-nav-target="social" type="button" id="mob-nav-social">
        <i class="fas fa-comments"></i><span>Social</span>
    </button>
    <button class="mobile-nav-btn" type="button" id="mob-nav-menu" aria-label="Open menu">
        <i class="fas fa-bars"></i><span>Menu</span>
    </button>
</nav>
<script>
(function initMobileExperience(){
    'use strict';var MOBILE_BP=768;
    function isMobile(){return window.innerWidth<=MOBILE_BP}
    function autoCollapseSidebar(){if(!isMobile())return;if(!document.body.classList.contains('lux-sidebar-collapsed')){document.body.classList.add('lux-sidebar-collapsed');document.body.dataset.luxSidebar='collapsed';localStorage.setItem('kiuLuxurySidebarCollapsed','1');var t=document.getElementById('lux-sidebar-toggle');if(t){t.classList.add('is-active');t.setAttribute('aria-pressed','true')}}}
    function setupBottomNav(){var nav=document.getElementById('mobile-bottom-nav');if(!nav)return;nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var t=b.getAttribute('data-nav-target');if(typeof window.navigate==='function')window.navigate(t);syncBottomNavActive(t);closeSidebarIfOpen()})});var m=document.getElementById('mob-nav-menu');if(m)m.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(typeof window.toggleSidebar==='function')window.toggleSidebar()})}
    function syncBottomNavActive(a){var n=document.getElementById('mobile-bottom-nav');if(!n)return;n.querySelectorAll('.mobile-nav-btn').forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-nav-target')===a)});var m=document.getElementById('mob-nav-menu');if(m)m.classList.remove('is-active')}
    function hookNavigationSync(){var o=window.navigate;if(typeof o==='function'&&!window.__mobileNavHooked){window.__mobileNavHooked=true;window.navigate=function(t){var r=o.apply(this,arguments);if(isMobile()){syncBottomNavActive(t);closeSidebarIfOpen()}return r}}}
    function closeSidebarIfOpen(){if(!isMobile())return;if(!document.body.classList.contains('lux-sidebar-collapsed')){if(typeof window.toggleSidebar==='function')window.toggleSidebar();else{document.body.classList.add('lux-sidebar-collapsed');document.body.dataset.luxSidebar='collapsed'}}}
    function setupOverlayDismiss(){document.addEventListener('click',function(e){if(!isMobile()||document.body.classList.contains('lux-sidebar-collapsed'))return;var s=document.getElementById('lux-shell'),t=document.getElementById('lux-topbar'),b=document.getElementById('mobile-bottom-nav');if(s&&s.contains(e.target))return;if(t&&t.contains(e.target))return;if(b&&b.contains(e.target))return;closeSidebarIfOpen()},true)}
    function setupSwipeGesture(){var sx=0,sy=0,tr=false;document.addEventListener('touchstart',function(e){if(!isMobile()||document.body.classList.contains('lux-sidebar-collapsed'))return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;tr=true},{passive:true});document.addEventListener('touchend',function(e){if(!tr)return;tr=false;if(sx-e.changedTouches[0].clientX>60&&Math.abs(sy-e.changedTouches[0].clientY)<100)closeSidebarIfOpen()},{passive:true})}
    function updateBottomNavForRole(){var l=document.getElementById('mob-nav-lms'),s=document.getElementById('mob-nav-timetable'),r='';try{r=typeof getEffectiveRole==='function'?getEffectiveRole():(typeof getEffectiveUserRole==='function'?getEffectiveUserRole():'')}catch(e){}if(l&&r==='admin'){l.setAttribute('data-nav-target','admin-tools');l.querySelector('i').className='fas fa-layer-group';l.querySelector('span').textContent='Tools'}if(s&&r==='admin'){s.setAttribute('data-nav-target','admin-scheduler');s.querySelector('i').className='fas fa-calendar-plus';s.querySelector('span').textContent='Scheduler'}if(l&&r==='student_service'){l.setAttribute('data-nav-target','student-service');l.querySelector('i').className='fas fa-headset';l.querySelector('span').textContent='Service'}}
    function onResize(){var n=document.getElementById('mobile-bottom-nav');if(!n)return;n.style.display=isMobile()?'':'none'}
    function init(){autoCollapseSidebar();setupBottomNav();setupOverlayDismiss();setupSwipeGesture();onResize();var h=setInterval(function(){if(typeof window.navigate==='function'){clearInterval(h);hookNavigationSync();updateBottomNavForRole()}},200);setTimeout(function(){clearInterval(h)},10000);window.addEventListener('resize',onResize)}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();
</script>
'@

$pages = @("lms.html","admin-tools.html")
foreach ($page in $pages) {
    $filePath = Join-Path $root $page
    if (-not (Test-Path $filePath)) { Write-Host "SKIP: $page not found"; continue }
    $content = [System.IO.File]::ReadAllText($filePath)
    if ($content -match 'mobile-bottom-nav') { Write-Host "SKIP: $page already has bottom nav"; continue }
    # Upgrade viewport
    $content = $content -replace 'content="width=device-width, initial-scale=1\.0"', 'content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"'
    # Add bottom nav before </body>
    $content = $content -replace '</body>', "$bottomNav`n</body>"
    [System.IO.File]::WriteAllText($filePath, $content)
    Write-Host "DONE: $page"
}
