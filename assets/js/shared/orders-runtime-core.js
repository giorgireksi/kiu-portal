/* Shared orders runtime primitives — load before orders-inbox.js or orders-workspace.js. */

function ensureOrdersState() {
    if (!KIU_STATE.ordersCenterByFaculty || typeof KIU_STATE.ordersCenterByFaculty !== 'object') {
        KIU_STATE.ordersCenterByFaculty = {};
    }
    if (!KIU_STATE.orderReadsByUser || typeof KIU_STATE.orderReadsByUser !== 'object') {
        KIU_STATE.orderReadsByUser = {};
    }
}

function getOrdersBucketForFaculty(faculty = getCurrentFaculty()) {
    ensureOrdersState();
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.ordersCenterByFaculty[normalizedFaculty]) {
        KIU_STATE.ordersCenterByFaculty[normalizedFaculty] = { items: [] };
    }
    if (!Array.isArray(KIU_STATE.ordersCenterByFaculty[normalizedFaculty].items)) {
        KIU_STATE.ordersCenterByFaculty[normalizedFaculty].items = [];
    }
    return KIU_STATE.ordersCenterByFaculty[normalizedFaculty];
}

function getOrderRoleLabel(role) {
    if (role === USER_ROLES.STUDENT) return 'Student';
    if (role === USER_ROLES.PROFESSOR) return 'Professor';
    if (role === USER_ROLES.TA) return 'Teaching Assistant';
    if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
    if (role === USER_ROLES.ADMIN) return 'Admin';
    return 'Portal User';
}

const ordersRegionMarkupCache = Object.create(null);

function setOrdersRegionMarkup(element, key, markup) {
    if (!element) return;
    if (ordersRegionMarkupCache[key] === markup) return;
    window.closePickerPanels?.({ immediate: true });
    element.innerHTML = markup;
    ordersRegionMarkupCache[key] = markup;
    window.enhanceUniversalPickers?.(element);
}

function createOrdersNode(tagName, { className = '', text = '', html = '', attrs = {} } = {}) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        node.setAttribute(key, String(value));
    });
    if (html) node.innerHTML = html;
    else if (text) node.textContent = text;
    return node;
}