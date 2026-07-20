/* Admin-library + registration CMS merge helpers. Peeled from api.js (E2).
 * Load before api.js.
 */
(function initApiAdminMergeRuntime() {
    if (window.__KIU_API_ADMIN_MERGE_LOADED) return;
    window.__KIU_API_ADMIN_MERGE_LOADED = true;

    window.__kiuCreateApiAdminMergeApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

const DEFAULT_ADMIN_LIBRARY_FORM_SCHEMA_IDS = [
    'title',
    'subtitle',
    'year',
    'author',
    'thematic',
    'language',
    'status',
    'pdfLink'
];

function isDefaultAdminLibraryFormSchema(schema) {
    if (!Array.isArray(schema) || schema.length !== DEFAULT_ADMIN_LIBRARY_FORM_SCHEMA_IDS.length) {
        return false;
    }
    return schema.every((field, index) => String(field?.id || '') === DEFAULT_ADMIN_LIBRARY_FORM_SCHEMA_IDS[index]);
}

function getAdminLibraryFormSchemaFieldSignature(schema) {
    if (!Array.isArray(schema)) return '';
    return schema.map((field) => String(field?.id || '')).filter(Boolean).sort().join('|');
}

function mergeAdminLibraryParamArrays(localItems, remoteItems) {
    const local = Array.isArray(localItems) ? localItems : [];
    const remote = Array.isArray(remoteItems) ? remoteItems : [];
    return [...new Set([...remote, ...local].map((item) => String(item)))];
}

function getAdminLibraryBookFreshness(book = {}) {
    const revision = Number(book?.revision || 0);
    if (Number.isFinite(revision) && revision > 0) return { kind: 'revision', value: revision };
    const updatedAt = Date.parse(String(book?.updatedAt || ''));
    if (Number.isFinite(updatedAt) && updatedAt > 0) return { kind: 'updatedAt', value: updatedAt };
    const createdAt = Date.parse(String(book?.createdAt || ''));
    if (Number.isFinite(createdAt) && createdAt > 0) return { kind: 'updatedAt', value: createdAt };
    return { kind: 'none', value: 0 };
}

function pickPreferredAdminLibraryBook(localBook, remoteBook, preferLocal = false) {
    if (!localBook) return clonePortalState(remoteBook);
    if (!remoteBook) return clonePortalState(localBook);
    const localFresh = getAdminLibraryBookFreshness(localBook);
    const remoteFresh = getAdminLibraryBookFreshness(remoteBook);
    if (localFresh.kind === 'revision' || remoteFresh.kind === 'revision') {
        const localRevision = Number(localBook?.revision || 0);
        const remoteRevision = Number(remoteBook?.revision || 0);
        if (localRevision !== remoteRevision) {
            return clonePortalState(localRevision > remoteRevision ? localBook : remoteBook);
        }
    }
    if (localFresh.kind === 'updatedAt' || remoteFresh.kind === 'updatedAt') {
        const localAt = localFresh.kind === 'updatedAt' ? localFresh.value : 0;
        const remoteAt = remoteFresh.kind === 'updatedAt' ? remoteFresh.value : 0;
        if (localAt !== remoteAt) {
            return clonePortalState(localAt > remoteAt ? localBook : remoteBook);
        }
    }
    return clonePortalState(preferLocal ? localBook : remoteBook);
}

function mergeAdminLibraryCatalogSections(localSections, remoteSections, preferLocal = false) {
    const sectionsById = new Map();
    const applySection = (section, overwriteExisting) => {
        const sectionId = String(section?.id || '').trim();
        if (!sectionId) return;
        if (!sectionsById.has(sectionId) || overwriteExisting) {
            sectionsById.set(sectionId, clonePortalState(section));
        }
    };
    (Array.isArray(remoteSections) ? remoteSections : []).forEach((section) => applySection(section, false));
    (Array.isArray(localSections) ? localSections : []).forEach((section) => {
        const sectionId = String(section?.id || '').trim();
        if (!sectionId) return;
        if (!sectionsById.has(sectionId)) {
            sectionsById.set(sectionId, clonePortalState(section));
            return;
        }
        if (preferLocal) {
            sectionsById.set(sectionId, clonePortalState(section));
        }
    });
    return [...sectionsById.values()];
}

function mergeAdminLibraryState(localLibrary, remoteLibrary, options = {}) {
    const local = localLibrary && typeof localLibrary === 'object' ? localLibrary : {};
    const remote = remoteLibrary && typeof remoteLibrary === 'object' ? remoteLibrary : {};
    const merged = clonePortalState(Object.keys(remote).length ? remote : local) || {};
    delete merged.catalogPageSize;
    delete merged.catalogPageIndex;
    delete merged.droplistFilters;

    const localSchema = Array.isArray(local.formSchema) ? local.formSchema : [];
    const remoteSchema = Array.isArray(remote.formSchema) ? remote.formSchema : [];
    const preferLocal = options.preferLocal === true;
    const localRevision = Number(local.formSchemaRevision || 0);
    const remoteRevision = Number(remote.formSchemaRevision || 0);
    const localSignature = getAdminLibraryFormSchemaFieldSignature(localSchema);
    const remoteSignature = getAdminLibraryFormSchemaFieldSignature(remoteSchema);

    const applyLocalSchemaMerge = () => {
        merged.formSchema = clonePortalState(localSchema);
        merged.formSchemaRevision = Math.max(localRevision, remoteRevision, localRevision || Date.now());
        if (local.formSchemaCustomized === true) merged.formSchemaCustomized = true;
    };
    const applyRemoteSchemaMerge = () => {
        merged.formSchema = clonePortalState(remoteSchema);
        merged.formSchemaRevision = Math.max(localRevision, remoteRevision);
        if (remote.formSchemaCustomized === true) merged.formSchemaCustomized = true;
    };

    if (localRevision > remoteRevision) {
        applyLocalSchemaMerge();
    } else if (local.formSchemaCustomized === true && localSignature !== remoteSignature) {
        applyLocalSchemaMerge();
    } else if (localRevision < remoteRevision && remoteSchema.length > 0) {
        applyRemoteSchemaMerge();
    } else if (localSignature !== remoteSignature && preferLocal) {
        applyLocalSchemaMerge();
    } else if (preferLocal) {
        applyLocalSchemaMerge();
    } else if (localSchema.length > remoteSchema.length) {
        merged.formSchema = clonePortalState(localSchema);
        merged.formSchemaRevision = Math.max(localRevision, remoteRevision);
        if (local.formSchemaCustomized === true) merged.formSchemaCustomized = true;
    } else if (remoteSchema.length > localSchema.length) {
        merged.formSchema = clonePortalState(remoteSchema);
        merged.formSchemaRevision = Math.max(localRevision, remoteRevision);
        if (remote.formSchemaCustomized === true) merged.formSchemaCustomized = true;
    } else if (localSchema.length > 0) {
        if (isDefaultAdminLibraryFormSchema(localSchema) && !isDefaultAdminLibraryFormSchema(remoteSchema)) {
            merged.formSchema = clonePortalState(remoteSchema);
            merged.formSchemaRevision = Math.max(localRevision, remoteRevision);
            if (remote.formSchemaCustomized === true) merged.formSchemaCustomized = true;
        } else if (options.preferLocal) {
            merged.formSchema = clonePortalState(localSchema);
            merged.formSchemaRevision = Math.max(localRevision, remoteRevision, localRevision || Date.now());
            if (local.formSchemaCustomized === true) merged.formSchemaCustomized = true;
        } else {
            merged.formSchema = clonePortalState(remoteSchema.length ? remoteSchema : localSchema);
            merged.formSchemaRevision = Math.max(localRevision, remoteRevision);
            if (remote.formSchemaCustomized === true) merged.formSchemaCustomized = true;
            else if (local.formSchemaCustomized === true) merged.formSchemaCustomized = true;
        }
    } else {
        merged.formSchema = [];
    }

    const booksById = new Map();
    (Array.isArray(remote.books) ? remote.books : []).forEach((book) => {
        const bookId = String(book?.id || '').trim();
        if (!bookId) return;
        booksById.set(bookId, clonePortalState(book));
    });
    (Array.isArray(local.books) ? local.books : []).forEach((book) => {
        const bookId = String(book?.id || '').trim();
        if (!bookId) return;
        const existing = booksById.get(bookId);
        booksById.set(bookId, existing
            ? pickPreferredAdminLibraryBook(book, existing, preferLocal)
            : clonePortalState(book));
    });
    merged.books = [...booksById.values()];

    const localSections = Array.isArray(local.catalogSections) ? local.catalogSections : [];
    const remoteSections = Array.isArray(remote.catalogSections) ? remote.catalogSections : [];
    merged.catalogSections = mergeAdminLibraryCatalogSections(localSections, remoteSections, preferLocal);

    const preferredSectionId = String(local.activeSectionId || remote.activeSectionId || '').trim();
    if (preferredSectionId && merged.catalogSections.some((section) => section.id === preferredSectionId)) {
        merged.activeSectionId = preferredSectionId;
    } else if (merged.catalogSections.length) {
        merged.activeSectionId = merged.catalogSections[0].id;
    } else {
        merged.activeSectionId = String(local.activeSectionId || remote.activeSectionId || 'books');
    }

    const localParams = local.params && typeof local.params === 'object' ? local.params : {};
    const remoteParams = remote.params && typeof remote.params === 'object' ? remote.params : {};
    merged.params = merged.params && typeof merged.params === 'object' ? merged.params : {};
    ['thematic', 'language', 'status'].forEach((key) => {
        merged.params[key] = mergeAdminLibraryParamArrays(localParams[key], remoteParams[key]);
    });

    // Keep UI-only fields client-local/session; never take them from remote persist.
    if (local.catalogPageSize !== undefined) merged.catalogPageSize = local.catalogPageSize;
    if (local.catalogPageIndex !== undefined) merged.catalogPageIndex = local.catalogPageIndex;
    if (local.droplistFilters !== undefined) {
        merged.droplistFilters = clonePortalState(local.droplistFilters);
    }

    return merged;
}

function mergeRegistrationCmsStateFromLocal(localState, remoteState) {
    if (!remoteState || typeof remoteState !== 'object') return;
    const local = localState && typeof localState === 'object' ? localState : {};

    remoteState.adminProgramStructures = remoteState.adminProgramStructures && typeof remoteState.adminProgramStructures === 'object'
        ? remoteState.adminProgramStructures
        : {};
    const structureFaculties = new Set([
        ...Object.keys(local.adminProgramStructures || {}),
        ...Object.keys(remoteState.adminProgramStructures || {})
    ]);
    structureFaculties.forEach((faculty) => {
        const localBucket = local.adminProgramStructures?.[faculty];
        if (shouldCopyLocalAdminProgramFacultyBucket(local, remoteState, faculty) && localBucket) {
            remoteState.adminProgramStructures[faculty] = clonePortalState(localBucket);
        }
    });

    remoteState.registrationCMSByFaculty = remoteState.registrationCMSByFaculty && typeof remoteState.registrationCMSByFaculty === 'object'
        ? remoteState.registrationCMSByFaculty
        : {};
    const cmsFaculties = new Set([
        ...Object.keys(local.registrationCMSByFaculty || {}),
        ...Object.keys(remoteState.registrationCMSByFaculty || {})
    ]);
    cmsFaculties.forEach((faculty) => {
        const localBucket = local.registrationCMSByFaculty?.[faculty];
        if (shouldCopyLocalRegistrationCmsConcMinorBucket(local, remoteState, faculty) && localBucket) {
            remoteState.registrationCMSByFaculty[faculty] = clonePortalState(localBucket);
        }
    });

    remoteState.meta = remoteState.meta && typeof remoteState.meta === 'object' ? remoteState.meta : {};
    const localMeta = local.meta && typeof local.meta === 'object' ? local.meta : {};
    remoteState.meta.registrationCmsRevision = Math.max(
        Number(remoteState.meta.registrationCmsRevision || 0),
        Number(localMeta.registrationCmsRevision || 0)
    );
    remoteState.meta.registrationCmsSavedAt = Math.max(
        Number(remoteState.meta.registrationCmsSavedAt || 0),
        Number(localMeta.registrationCmsSavedAt || 0),
        getRegistrationCmsRevisionMs(remoteState),
        getRegistrationCmsRevisionMs(local)
    );
}

        const api = {
            isDefaultAdminLibraryFormSchema,
            getAdminLibraryFormSchemaFieldSignature,
            mergeAdminLibraryParamArrays,
            getAdminLibraryBookFreshness,
            pickPreferredAdminLibraryBook,
            mergeAdminLibraryCatalogSections,
            mergeAdminLibraryState,
            mergeRegistrationCmsStateFromLocal,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateApiAdminMergeApi({});
})();
