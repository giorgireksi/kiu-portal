# Simple: just insert block before </body> on pages that are missing it
$root = "c:\mock yo - Copy - Copy (15) - Copy - Copy - Copy - Copy"

$block = @'
<!-- MOBILE BOTTOM NAVIGATION (v2 — Full Command Bar) -->
<nav id="mobile-bottom-nav" aria-label="Mobile navigation" style="display:none;">
    <div class="mobile-nav-row">
        <button class="mobile-nav-btn is-active" data-nav-target="home" type="button" id="mob-nav-home">
            <i class="fas fa-th-large"></i><span>Home</span>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-messages" data-action="messages">
            <i class="fas fa-comment-dots"></i><span>Chat</span>
            <em class="mob-badge" id="mob-badge-msg" style="display:none;">0</em>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-notif" data-action="notifications">
            <i class="fas fa-bell"></i><span>Alerts</span>
            <em class="mob-badge" id="mob-badge-notif" style="display:none;">0</em>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-theme" data-action="theme">
            <i class="fas fa-palette"></i><span>Theme</span>
        </button>
        <button class="mobile-nav-btn" type="button" id="mob-nav-more" data-action="more">
            <i class="fas fa-grip-horizontal"></i><span>More</span>
        </button>
    </div>
</nav>
<div id="mobile-action-sheet" class="mob-sheet" style="display:none;" role="dialog" aria-modal="true">
    <div class="mob-sheet-backdrop" id="mob-sheet-backdrop"></div>
    <div class="mob-sheet-panel">
        <div class="mob-sheet-handle"><span></span></div>
        <div class="mob-sheet-section">
            <div class="mob-sheet-label">Quick Actions</div>
            <div class="mob-sheet-grid">
                <button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706);"><i class="fas fa-user-shield"></i></div><span>Admin View</span></button>
                <button class="mob-sheet-btn" id="mob-act-theme"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);"><i class="fas fa-palette"></i></div><span>Theme</span></button>
                <button class="mob-sheet-btn" id="mob-act-profile"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#06b6d4,#0891b2);"><i class="fas fa-user-circle"></i></div><span>Profile</span></button>
                <button class="mob-sheet-btn" id="mob-act-lightmode"><div class="mob-sheet-icon" style="background:linear-gradient(135deg,#f97316,#ea580c);"><i class="fas fa-sun"></i></div><span>Light Mode</span></button>
            </div>
        </div>
        <div class="mob-sheet-section" id="mob-sheet-student-nav">
            <div class="mob-sheet-label">Navigate</div>
            <div class="mob-sheet-nav">
                <button class="mob-sheet-nav-btn" data-nav-target="home"><i class="fas fa-th-large"></i><span>Dashboard</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="lms"><i class="fas fa-book-reader"></i><span>LMS</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="timetable"><i class="fas fa-calendar-week"></i><span>Timetable</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="social"><i class="fas fa-comments"></i><span>Social</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="registration"><i class="fas fa-clipboard-list"></i><span>Registration</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="library"><i class="fas fa-book"></i><span>Library</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="orders"><i class="fas fa-paper-plane"></i><span>Orders</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="personal-data"><i class="fas fa-id-badge"></i><span>Personal Data</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="study-card"><i class="fas fa-graduation-cap"></i><span>Study Card</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="programs"><i class="fas fa-sitemap"></i><span>Programs</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="chancellery"><i class="fas fa-file-alt"></i><span>Chancellery</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="gradebook"><i class="fas fa-chart-bar"></i><span>Gradebook</span></button>
            </div>
        </div>
        <div class="mob-sheet-section" id="mob-sheet-admin-section" style="display:none;">
            <div class="mob-sheet-label">Administration</div>
            <div class="mob-sheet-nav">
                <button class="mob-sheet-nav-btn" data-nav-target="admin-tools"><i class="fas fa-layer-group"></i><span>Admin Tools</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="admin-scheduler"><i class="fas fa-calendar-plus"></i><span>Scheduler</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="admin-library"><i class="fas fa-book-medical"></i><span>Library Mgmt</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="admin-orders"><i class="fas fa-inbox"></i><span>Orders Mgmt</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="staff"><i class="fas fa-users-cog"></i><span>Staff</span></button>
                <button class="mob-sheet-nav-btn" data-nav-target="students-admin"><i class="fas fa-user-graduate"></i><span>Students</span></button>
            </div>
        </div>
        <div class="mob-sheet-section" id="mob-sheet-service-section" style="display:none;">
            <div class="mob-sheet-label">Service Desk</div>
            <div class="mob-sheet-nav">
                <button class="mob-sheet-nav-btn" data-nav-target="student-service"><i class="fas fa-headset"></i><span>Service Desk</span></button>
            </div>
        </div>
        <div class="mob-sheet-footer">
            <button class="mob-sheet-close-btn" id="mob-sheet-close"><i class="fas fa-times"></i> Close</button>
        </div>
    </div>
</div>
<script>
(function initMobileExperience(){
'use strict';var BP=1024;
function isMob(){return window.innerWidth<=BP}
function getRole(){var r='';try{r=typeof getEffectiveRole==='function'?getEffectiveRole():(typeof getEffectiveUserRole==='function'?getEffectiveUserRole():'')}catch(e){}return r||''}
function autoCollapse(){if(!isMob())return;if(!document.body.classList.contains('lux-sidebar-collapsed')){document.body.classList.add('lux-sidebar-collapsed');document.body.dataset.luxSidebar='collapsed';localStorage.setItem('kiuLuxurySidebarCollapsed','1');var t=document.getElementById('lux-sidebar-toggle');if(t){t.classList.add('is-active');t.setAttribute('aria-pressed','true')}}}
function setupNav(){var nav=document.getElementById('mobile-bottom-nav');if(!nav)return;nav.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var t=b.getAttribute('data-nav-target');if(typeof window.navigate==='function')window.navigate(t);syncActive(t);closeSB();closeSheet()})});var mb=document.getElementById('mob-nav-messages');if(mb)mb.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var f=document.querySelector('.portal-msg-fab');if(f){f.click();return}if(typeof window.toggleMessaging==='function'){window.toggleMessaging();return}var u=document.querySelector('[data-utility="messages"]');if(u)u.click()});var nb=document.getElementById('mob-nav-notif');if(nb)nb.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var f=document.querySelector('.portal-notif-fab');if(f){f.click();return}if(typeof window.toggleNotifications==='function'){window.toggleNotifications();return}var u=document.querySelector('[data-utility="notifications"]');if(u)u.click()});var tb=document.getElementById('mob-nav-theme');if(tb)tb.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openStd()});var xb=document.getElementById('mob-nav-more');if(xb)xb.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();toggleSheet()})}
function openStd(){var b=document.querySelector('.lux-topbar-editor-btn');if(b){b.click();return}var s=document.querySelector('.lux-studio-backdrop');if(s){s.classList.add('is-open');return}if(typeof window.openStudio==='function')window.openStudio()}
function setupSheet(){var bd=document.getElementById('mob-sheet-backdrop');if(bd)bd.addEventListener('click',closeSheet);var cb=document.getElementById('mob-sheet-close');if(cb)cb.addEventListener('click',closeSheet);var sh=document.getElementById('mobile-action-sheet');if(!sh)return;sh.querySelectorAll('.mob-sheet-nav-btn[data-nav-target]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var t=b.getAttribute('data-nav-target');if(typeof window.navigate==='function')window.navigate(t);syncActive(t);closeSheet();closeSB()})});var as=document.getElementById('mob-act-admin');if(as)as.addEventListener('click',function(e){e.preventDefault();closeSheet();var p=document.querySelector('.lux-picker-btn');if(p){p.click();return}});var ts=document.getElementById('mob-act-theme');if(ts)ts.addEventListener('click',function(e){e.preventDefault();closeSheet();openStd()});var ps=document.getElementById('mob-act-profile');if(ps)ps.addEventListener('click',function(e){e.preventDefault();closeSheet();if(typeof window.navigate==='function')window.navigate('profile-view')});var ls=document.getElementById('mob-act-lightmode');if(ls)ls.addEventListener('click',function(e){e.preventDefault();document.body.classList.toggle('lux-light-mode');var il=document.body.classList.contains('lux-light-mode');ls.querySelector('span').textContent=il?'Dark Mode':'Light Mode';ls.querySelector('i').className=il?'fas fa-moon':'fas fa-sun';localStorage.setItem('kiuLuxuryLightMode',il?'1':'0')})}
function toggleSheet(){var s=document.getElementById('mobile-action-sheet');if(!s)return;s.style.display!=='none'?closeSheet():openSheet()}
function openSheet(){var s=document.getElementById('mobile-action-sheet');if(!s)return;s.style.display='';document.body.style.overflow='hidden';requestAnimationFrame(function(){s.classList.add('is-open')});updRoleNav()}
function closeSheet(){var s=document.getElementById('mobile-action-sheet');if(!s)return;s.classList.remove('is-open');document.body.style.overflow='';setTimeout(function(){s.style.display='none'},300)}
function updRoleNav(){var role=getRole();var a=document.getElementById('mob-sheet-admin-section');var sv=document.getElementById('mob-sheet-service-section');if(a)a.style.display=(role==='admin')?'':'none';if(sv)sv.style.display=(role==='admin'||role==='student_service')?'':'none';var ab=document.getElementById('mob-act-admin');if(ab)ab.style.display=(role==='admin'||role==='student_service')?'':'none'}
function syncActive(t){var n=document.getElementById('mobile-bottom-nav');if(!n)return;n.querySelectorAll('.mobile-nav-btn[data-nav-target]').forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-nav-target')===t)});['mob-nav-messages','mob-nav-notif','mob-nav-theme','mob-nav-more'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove('is-active')})}
function hookNav(){var o=window.navigate;if(typeof o==='function'&&!window.__mobileNavHooked){window.__mobileNavHooked=true;window.navigate=function(t){var r=o.apply(this,arguments);if(isMob()){syncActive(t);closeSB();closeSheet()}return r}}}
function closeSB(){if(!isMob())return;if(!document.body.classList.contains('lux-sidebar-collapsed')){if(typeof window.toggleSidebar==='function')window.toggleSidebar();else{document.body.classList.add('lux-sidebar-collapsed');document.body.dataset.luxSidebar='collapsed'}}}
function onResize(){var n=document.getElementById('mobile-bottom-nav');if(!n)return;n.style.display=isMob()?'':'none';if(!isMob()){closeSheet()}}
function init(){autoCollapse();setupNav();setupSheet();onResize();var ht=setInterval(function(){if(typeof window.navigate==='function'){clearInterval(ht);hookNav();updRoleNav()}},200);setTimeout(function(){clearInterval(ht)},10000);window.addEventListener('resize',onResize);document.addEventListener('touchstart',function(e){if(!isMob()||document.body.classList.contains('lux-sidebar-collapsed'))return;window.__swX=e.touches[0].clientX;window.__swY=e.touches[0].clientY},{passive:true});document.addEventListener('touchend',function(e){if(!window.__swX)return;var dx=window.__swX-e.changedTouches[0].clientX;var dy=Math.abs(window.__swY-e.changedTouches[0].clientY);window.__swX=0;if(dx>60&&dy<100)closeSB()},{passive:true});setInterval(function(){if(!isMob())return;var mb=document.getElementById('mob-badge-msg');var nb=document.getElementById('mob-badge-notif');var mf=document.querySelector('.portal-msg-fab .badge,.portal-msg-fab .count');var nf=document.querySelector('.portal-notif-fab .badge,.portal-notif-fab .count');if(mb&&mf){var v=parseInt(mf.textContent)||0;mb.textContent=v;mb.style.display=v>0?'':'none'}if(nb&&nf){var v2=parseInt(nf.textContent)||0;nb.textContent=v2;nb.style.display=v2>0?'':'none'}},3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();
</script>
'@

$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -File | Where-Object { $_.Name -ne 'calendar.html' }
$count = 0

foreach ($file in $htmlFiles) {
    $content = [IO.File]::ReadAllText($file.FullName)

    # Check if already has the nav (skip if so)
    if ($content -match '<nav id="mobile-bottom-nav"') {
        Write-Host "  Already has nav: $($file.Name)"
        continue
    }

    # Insert before </body>
    $content = $content.Replace('</body>', "$block`n</body>")
    [IO.File]::WriteAllText($file.FullName, $content)
    $count++
    Write-Host "  Injected: $($file.Name)"
}

Write-Host "`nInjected into $count files."
