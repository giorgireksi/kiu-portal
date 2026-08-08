/* Shared dependency-gated assembly loading runtime. Route visuals stay in route CSS. */
(function installAssemblyLoadingFactory(global) {
    'use strict';

    if (global.__kiuCreateAssemblyLoadingMotion) return;

    const DEFAULT_TIMING = Object.freeze({
        maxShellWaitMs: 1800,
        lateAssemblyGraceMs: 145,
        maxAssemblyWindowMs: 1650,
        maxTotalAssemblyMs: 2450
    });
    const DEFAULT_FLIGHT_TIMING = Object.freeze({
        outerDurationMs: 400,
        innerDurationMs: 260,
        innerMinDurationMs: 180,
        innerDepthStepMs: 20,
        outerStaggerMs: 38,
        innerStaggerMs: 23,
        outerMaxDelayMs: 70,
        innerMaxDelayMs: 85
    });

    function createAssemblyLoadingMotion(options = {}) {
        const classes = {
            active: options.classes?.active || 'kiu-assembly-active',
            ready: options.classes?.ready || 'kiu-assembly-ready',
            target: options.classes?.target || 'kiu-assembly-target',
            outer: options.classes?.outer || 'kiu-assembly-outer',
            inner: options.classes?.inner || 'kiu-assembly-inner',
            structure: options.classes?.structure || 'kiu-assembly-structure',
            flight: options.classes?.flight || 'is-flight',
            staging: options.classes?.staging || 'is-staging'
        };
        const timing = { ...DEFAULT_TIMING, ...(options.timing || {}) };
        const flightTiming = { ...DEFAULT_FLIGHT_TIMING, ...(options.flightTiming || {}) };
        const contentWaitMaxMs = Number.isFinite(Number(timing.contentWaitMaxMs))
            ? Number(timing.contentWaitMaxMs)
            : timing.maxShellWaitMs;
        const outerSelectors = Array.isArray(options.outerSelectors)
            ? options.outerSelectors
            : [options.outerSelectors].filter(Boolean);
        const granularSelector = Array.isArray(options.granularSelector)
            ? options.granularSelector.join(', ')
            : String(options.granularSelector || '');
        const controlSelector = Array.isArray(options.controlSelector)
            ? options.controlSelector.join(', ')
            : String(options.controlSelector || '');
        const structureSelector = Array.isArray(options.structureSelector)
            ? options.structureSelector.join(', ')
            : String(options.structureSelector || '');
        const hiddenSelector = options.hiddenSelector
            || '[hidden], [aria-hidden="true"], template';
        const requireLayoutRect = Boolean(options.requireLayoutRect);
        const flattenInnerTargets = Boolean(options.flattenInnerTargets);
        const hierarchySelector = Array.isArray(options.hierarchySelector)
            ? options.hierarchySelector.join(', ')
            : String(options.hierarchySelector || '');
        const outerFlightSelector = Array.isArray(options.outerFlightSelector)
            ? options.outerFlightSelector.join(', ')
            : String(options.outerFlightSelector || '');
        const transformSafeSelector = Array.isArray(options.transformSafeSelector)
            ? options.transformSafeSelector.join(', ')
            : String(options.transformSafeSelector || '');
        const getMotionProfile = typeof options.getMotionProfile === 'function'
            ? options.getMotionProfile
            : null;
        const animateLateAfterReady = Boolean(options.animateLateAfterReady);
        const lateReadyWindowMs = Number.isFinite(Number(options.lateReadyWindowMs))
            ? Number(options.lateReadyWindowMs)
            : 0;
        const lateReplaySelector = Array.isArray(options.lateReplaySelector)
            ? options.lateReplaySelector.join(', ')
            : String(options.lateReplaySelector || '');
        const unlimitedLateReplay = Boolean(options.unlimitedLateReplay);
        const autoReplayLateMutations = options.autoReplayLateMutations !== false;
        const autoStart = options.autoStart !== false;
        const rootStateDataset = options.rootStateDataset || 'kiuAssemblyState';
        const phaseDataset = options.phaseDataset || 'kiuAssemblyPhase';
        const state = {
            observer: null,
            root: null,
            animations: new Set(),
            nodeStatus: new Map(),
            lateRuns: new Set(),
            phase: 'idle',
            waitTimer: 0,
            scheduleTimer: 0,
            deadlineTimer: 0,
            generation: 0,
            readyAt: 0,
            lateFinishTimer: 0,
            pendingReplay: null,
            targetCount: 0,
            lastEvent: 'idle',
            lastError: null,
            animationSupported: false,
            reducedMotion: false
        };

        const isRoute = () => typeof options.isRoute === 'function' && options.isRoute();
        const isContentReady = () => typeof options.isContentReady !== 'function'
            || Boolean(options.isContentReady());
        const getPageRoot = () => typeof options.getPageRoot === 'function'
            ? options.getPageRoot()
            : document.querySelector(options.rootSelector);
        const getObserverRoot = () => typeof options.getObserverRoot === 'function'
            ? options.getObserverRoot()
            : document.querySelector(options.observerSelector || options.rootSelector);
        const getExternalRoots = (root) => {
            if (typeof options.getExternalRoots !== 'function') return [];
            const roots = options.getExternalRoots(root);
            return (Array.isArray(roots) ? roots : []).filter((element) => element && element !== root);
        };
        const getScopes = (root) => [root, ...getExternalRoots(root)].filter(Boolean);
        const queryScopes = (root, selector) => {
            if (!selector) return [];
            return getScopes(root).flatMap((scope) => {
                const matches = [];
                if (scope.matches?.(selector)) matches.push(scope);
                matches.push(...scope.querySelectorAll(selector));
                return matches;
            });
        };

        function isVisibleAssemblyElement(element, root) {
            if (!element || element === root) return false;
            if (element.closest(hiddenSelector)) return false;
            if (requireLayoutRect
                && typeof element.getClientRects === 'function'
                && element.getClientRects().length === 0) {
                return false;
            }
            return true;
        }

        function getAssemblyTree(root) {
            if (!root) return { roots: [], nodes: [] };
            const candidates = [];
            const seen = new Set();
            const outerElements = new Set();
            const addCandidate = (element) => {
                if (!element || seen.has(element) || !isVisibleAssemblyElement(element, root)) return;
                if (structureSelector && element.matches?.(structureSelector)) return;
                seen.add(element);
                candidates.push(element);
            };

            outerSelectors.forEach((selector) => {
                queryScopes(root, selector).forEach((element) => {
                    addCandidate(element);
                    if (seen.has(element)) outerElements.add(element);
                });
            });
            const candidateSelector = [granularSelector, controlSelector]
                .filter(Boolean)
                .join(', ');
            if (candidateSelector) {
                queryScopes(root, candidateSelector).forEach(addCandidate);
            }

            const nodesByElement = new Map(
                candidates.map((element) => [element, {
                    element,
                    parent: null,
                    children: [],
                    depth: 0,
                    siblingIndex: 0
                }])
            );
            const hierarchyElements = new Set(
                hierarchySelector
                    ? candidates.filter((element) => element.matches?.(hierarchySelector))
                    : []
            );
            const roots = [];
            candidates.forEach((element) => {
                const node = nodesByElement.get(element);
                let ancestor = element.parentElement;
                if (flattenInnerTargets && !outerElements.has(element)) {
                    while (ancestor && ancestor !== root) {
                        if (outerElements.has(ancestor) || hierarchyElements.has(ancestor)) {
                            node.parent = nodesByElement.get(ancestor);
                            node.parent.children.push(node);
                            node.depth = 1;
                            break;
                        }
                        ancestor = ancestor.parentElement;
                    }
                } else {
                    while (ancestor && ancestor !== root) {
                        if (nodesByElement.has(ancestor)) {
                            node.parent = nodesByElement.get(ancestor);
                            node.parent.children.push(node);
                            node.depth = node.parent.depth + 1;
                            break;
                        }
                        ancestor = ancestor.parentElement;
                    }
                }
                if (!node.parent) roots.push(node);
            });
            const assignSiblingIndexes = (nodes) => {
                nodes.forEach((node, index) => {
                    node.siblingIndex = index;
                    assignSiblingIndexes(node.children);
                });
            };
            assignSiblingIndexes(roots);
            return { roots, nodes: candidates.map((element) => nodesByElement.get(element)) };
        }

        function getTargets(root) {
            return getAssemblyTree(root).nodes.map((node) => node.element);
        }

        function getTransformSafeAncestor(element, root) {
            if (!transformSafeSelector) return null;
            let ancestor = element;
            while (ancestor && ancestor !== root) {
                if (ancestor.matches?.(transformSafeSelector)) return ancestor;
                ancestor = ancestor.parentElement;
            }
            return null;
        }

        function getTargetMotionProfile(target, node, root) {
            const ownProfile = getMotionProfile?.(target, node) || {};
            const safeAncestor = getTransformSafeAncestor(target, root);
            if (!safeAncestor || safeAncestor === target) return ownProfile;
            const inheritedProfile = getMotionProfile?.(safeAncestor, node) || {};
            return {
                ...inheritedProfile,
                ...ownProfile,
                preserveTransform: Boolean(
                    inheritedProfile.preserveTransform
                    || ownProfile.preserveTransform
                    || safeAncestor
                )
            };
        }

        function registerStructures(root) {
            if (!root || !structureSelector) return;
            queryScopes(root, structureSelector).forEach((element) => {
                if (isVisibleAssemblyElement(element, root)) {
                    element.classList.add(classes.structure);
                }
            });
        }

        function isSharedShellReady() {
            const loadState = global.__kiuShellLoadState;
            return document.documentElement?.classList.contains('kiu-shell-ready')
                || document.body?.classList.contains('kiu-shell-ready')
                || loadState?.phase === 'ready';
        }

        function isSharedRevealActive() {
            return document.documentElement?.classList.contains('kiu-shell-loading')
                || document.documentElement?.classList.contains('kiu-shell-revealing')
                || document.body?.classList.contains('kiu-shell-loading')
                || document.body?.classList.contains('kiu-shell-revealing');
        }

        function recordEvent(event, error = null) {
            state.lastEvent = event;
            state.lastError = error
                ? String(error?.message || error)
                : null;
        }

        function clearAnimationState() {
            state.animations.forEach((animation) => {
                try { animation.cancel(); } catch (_error) {}
            });
            state.animations.clear();
            state.nodeStatus.clear();
            state.lateRuns.clear();
            state.readyAt = 0;
            if (state.waitTimer) {
                window.clearTimeout(state.waitTimer);
                state.waitTimer = 0;
            }
            if (state.deadlineTimer) {
                window.clearTimeout(state.deadlineTimer);
                state.deadlineTimer = 0;
            }
            if (state.lateFinishTimer) {
                window.clearTimeout(state.lateFinishTimer);
                state.lateFinishTimer = 0;
            }
        }

        function finish(root, generation) {
            if (state.phase === 'ready' || state.root !== root || state.generation !== generation) return;
            const pendingReplay = state.pendingReplay;
            state.pendingReplay = null;
            clearAnimationState();
            state.phase = 'ready';
            state.readyAt = Date.now();
            recordEvent('ready');
            root.dataset[rootStateDataset] = 'ready';
            document.body?.classList.remove(classes.active);
            document.body?.classList.add(classes.ready);
            getTargets(root).forEach((target) => {
                target.classList.remove(classes.flight);
                target.classList.remove(classes.staging);
                if (target.classList.contains(classes.outer)) {
                    target.dataset[phaseDataset] = 'ready';
                }
            });
            if (pendingReplay) {
                window.setTimeout(() => {
                    startReadyLateNodes(root, generation, pendingReplay, true);
                }, 0);
            }
        }

        function createFlight(node, root) {
            const target = node.element;
            const rect = typeof target.getBoundingClientRect === 'function'
                ? target.getBoundingClientRect()
                : { left: 0, width: 320 };
            const isOuterShell = node.depth === 0
                || Boolean(outerFlightSelector && target.matches?.(outerFlightSelector));
            const distance = isOuterShell
                ? Math.max(Number(rect.left || 0) + Number(rect.width || 320) + 40, 320)
                : Math.min(Math.max(Number(rect.width || 320) * 0.12, 38), 72);
            const rotation = isOuterShell ? -1.6 : -0.65;
            const motionProfile = getTargetMotionProfile(target, node, root);
            const preserveTransform = Boolean(
                motionProfile.preserveTransform
                || (transformSafeSelector && target.matches?.(transformSafeSelector))
            );
            const duration = isOuterShell
                ? flightTiming.outerDurationMs
                : Math.max(
                    flightTiming.innerMinDurationMs,
                    flightTiming.innerDurationMs - (node.depth * flightTiming.innerDepthStepMs)
                );
            const delay = Math.min(
                node.siblingIndex * (isOuterShell ? flightTiming.outerStaggerMs : flightTiming.innerStaggerMs),
                isOuterShell ? flightTiming.outerMaxDelayMs : flightTiming.innerMaxDelayMs
            );

            target.classList.add(classes.flight);
            const keyframes = [
                {
                    opacity: 0,
                    transform: `translate3d(-${distance}px, ${isOuterShell ? '-16px' : '0'}, 0) rotate(${rotation}deg) scale(${isOuterShell ? '1.025' : '1.015'})`,
                    filter: `blur(${isOuterShell ? '4px' : '2px'})`
                },
                {
                    opacity: 0.88,
                    transform: `translate3d(-${distance * 0.46}px, ${isOuterShell ? '-8px' : '0'}, 0) rotate(${rotation * 0.5}deg) scale(${isOuterShell ? '1.014' : '1.008'})`,
                    filter: `blur(${isOuterShell ? '2px' : '1px'})`,
                    offset: 0.42
                },
                {
                    opacity: 1,
                    transform: `translate3d(-${distance * 0.1}px, ${isOuterShell ? '-2px' : '0'}, 0) rotate(${rotation * 0.1}deg) scale(1.002)`,
                    filter: 'blur(.5px)',
                    offset: 0.72
                },
                {
                    opacity: 1,
                    transform: `translate3d(10px, ${isOuterShell ? '1px' : '0'}, 0) rotate(0deg) scale(1)`,
                    filter: 'blur(0)',
                    offset: 0.87
                },
                {
                    opacity: 1,
                    transform: 'translate3d(-3px, 0, 0) rotate(0deg) scale(1)',
                    filter: 'blur(0)',
                    offset: 0.95
                },
                {
                    opacity: 1,
                    transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
                    filter: 'blur(0)'
                }
            ];
            if (preserveTransform) {
                keyframes.forEach((frame) => delete frame.transform);
            }
            return target.animate(keyframes, {
                delay,
                duration,
                easing: 'cubic-bezier(.17,.84,.26,1)',
                fill: 'both'
            });
        }

        function registerTree(tree) {
            tree.nodes.forEach((node) => {
                if (!state.nodeStatus.has(node.element)) state.nodeStatus.set(node.element, 'pending');
                node.element.classList.add(
                    classes.target,
                    node.depth === 0 ? classes.outer : classes.inner
                );
                if (node.depth === 0 && !node.element.dataset[phaseDataset]) {
                    node.element.dataset[phaseDataset] = 'flight';
                }
            });
        }

        function isAnimationSupported() {
            return typeof Element !== 'undefined'
                && typeof Element.prototype.animate === 'function';
        }

        function getCurrentNode(element, root) {
            return getAssemblyTree(root).nodes.find((node) => node.element === element) || null;
        }

        function runSiblings(nodes, root, generation) {
            const runnable = nodes.filter((node) => {
                const status = state.nodeStatus.get(node.element);
                return state.phase === 'active'
                    && state.root === root
                    && state.generation === generation
                    && status !== 'active'
                    && status !== 'done';
            });
            return Promise.all(runnable.map((node) => runNode(node, root, generation)));
        }

        function completeNode(node, root, generation) {
            if (state.root !== root || state.generation !== generation) return undefined;
            node.element.classList.remove(classes.flight);
            state.nodeStatus.set(node.element, 'done');
            if (node.depth === 0) node.element.dataset[phaseDataset] = 'children';
            const currentNode = getCurrentNode(node.element, root);
            return currentNode ? runSiblings(currentNode.children, root, generation) : undefined;
        }

        function runNode(node, root, generation) {
            if (state.phase !== 'active' || state.root !== root || state.generation !== generation) {
                return Promise.resolve();
            }
            const status = state.nodeStatus.get(node.element);
            if (status === 'active' || status === 'done') return Promise.resolve();
            state.nodeStatus.set(node.element, 'active');

            let animation = null;
            try {
                animation = createFlight(node, root);
            } catch (error) {
                recordEvent('animation-create-error', error);
                node.element.classList.remove(classes.flight);
            }
            if (!animation) {
                state.nodeStatus.set(node.element, 'done');
                if (node.depth === 0) node.element.dataset[phaseDataset] = 'children';
                const currentNode = getCurrentNode(node.element, root);
                return currentNode ? runSiblings(currentNode.children, root, generation) : Promise.resolve();
            }

            state.animations.add(animation);
            let finished = null;
            try {
                finished = animation.finished;
            } catch (error) {
                recordEvent('animation-finished-error', error);
            }
            if (!finished || typeof finished.then !== 'function') {
                recordEvent('animation-finished-unsupported');
                try { animation.cancel?.(); } catch (_error) {}
                state.animations.delete(animation);
                return completeNode(node, root, generation);
            }
            return Promise.resolve(finished)
                .catch((error) => {
                    if (error?.name !== 'AbortError') recordEvent('animation-rejected', error);
                    return null;
                })
                .then(() => completeNode(node, root, generation));
        }

        function scheduleLateFinish(root, generation) {
            if (state.lateFinishTimer) {
                window.clearTimeout(state.lateFinishTimer);
            }
            state.lateFinishTimer = window.setTimeout(() => {
                state.lateFinishTimer = 0;
                if (state.phase !== 'active' || state.root !== root || state.generation !== generation) return;
                const tree = getAssemblyTree(root);
                registerStructures(root);
                registerTree(tree);
                const hasPendingNodes = tree.nodes.some((node) => {
                    const status = state.nodeStatus.get(node.element);
                    return status === 'pending' || status === 'active';
                });
                if (hasPendingNodes || state.lateRuns.size) {
                    startLateNodes(root, generation);
                    scheduleLateFinish(root, generation);
                    return;
                }
                finish(root, generation);
            }, 64);
        }

        function startLateNodes(root, generation) {
            if (state.phase !== 'active' || state.root !== root || state.generation !== generation) return;
            const tree = getAssemblyTree(root);
            registerStructures(root);
            registerTree(tree);
            const runnable = tree.nodes.filter((node) => (
                state.nodeStatus.get(node.element) === 'pending'
                && node.parent
                && state.nodeStatus.get(node.parent.element) === 'done'
            ));
            if (!runnable.length) return;
            const run = runSiblings(runnable, root, generation);
            runnable.forEach((node) => node.element.classList.add(classes.staging));
            state.lateRuns.add(run);
            const clear = () => state.lateRuns.delete(run);
            run.then(clear, clear);
            if (state.readyAt) scheduleLateFinish(root, generation);
        }

        function startReadyLateNodes(root, generation, requestedSelectors = '', force = false) {
            if (!animateLateAfterReady
                || state.phase !== 'ready'
                || state.root !== root
                || state.generation !== generation
                || !state.readyAt
                || (!force && !unlimitedLateReplay && Date.now() - state.readyAt > lateReadyWindowMs)) {
                return false;
            }
            const tree = getAssemblyTree(root);
            state.targetCount = tree.nodes.length;
            const freshNodes = tree.nodes.filter((node) => (
                !node.element.classList.contains(classes.target)
            ));
            const selector = Array.isArray(requestedSelectors)
                ? requestedSelectors.join(', ')
                : String(requestedSelectors || '');
            const boundaries = selector
                ? queryScopes(root, selector)
                : [];
            const replayElements = new Set();
            (boundaries.length ? boundaries : queryScopes(root, lateReplaySelector)).forEach((candidate) => {
                if (force || freshNodes.some((node) => candidate.contains(node.element))) {
                    replayElements.add(candidate);
                }
            });
            if (!freshNodes.length && !replayElements.size) {
                return false;
            }
            const isReplayNode = (node) => Array.from(replayElements).some((boundary) => (
                boundary === node.element || boundary.contains(node.element)
            ));
            const lateNodes = [
                ...(force
                    ? tree.nodes.filter(isReplayNode)
                    : [...freshNodes, ...tree.nodes.filter((node) => replayElements.has(node.element))])
            ];
            lateNodes.forEach((node) => node.element.classList.add(classes.staging));

            state.phase = 'active';
            root.dataset[rootStateDataset] = 'active';
            document.body?.classList.remove(classes.ready);
            document.body?.classList.add(classes.active);
            state.nodeStatus.clear();
            tree.nodes.forEach((node) => {
                state.nodeStatus.set(
                    node.element,
                    node.element.classList.contains(classes.target)
                        ? (replayElements.has(node.element) ? 'pending' : 'done')
                        : 'pending'
                );
            });
            registerStructures(root);
            registerTree(tree);
            if (!isAnimationSupported()) {
                finish(root, generation);
                return true;
            }
            const runnable = lateNodes.filter((node) => (
                state.nodeStatus.get(node.element) === 'pending'
                && (!node.parent || state.nodeStatus.get(node.parent.element) === 'done')
            ));
            if (!runnable.length) {
                scheduleLateFinish(root, generation);
                return true;
            }
            const run = runSiblings(runnable, root, generation);
            state.lateRuns.add(run);
            const clear = () => state.lateRuns.delete(run);
            run.then(clear, clear);
            scheduleLateFinish(root, generation);
            return true;
        }

        function resetForReplay(root) {
            state.animations.forEach((animation) => {
                try { animation.cancel?.(); } catch (_error) {}
            });
            clearAnimationState();
            state.generation += 1;
            state.phase = 'ready';
            state.readyAt = Date.now();
            state.pendingReplay = null;
            recordEvent('replay-reset');
            root.dataset[rootStateDataset] = 'ready';
            document.body?.classList.remove(classes.active);
            document.body?.classList.add(classes.ready);
        }

        function replay(requestedSelectors = '') {
            if (!isRoute()) return false;
            const root = getPageRoot();
            if (!root) return false;
            if (state.root !== root || state.phase === 'idle') {
                return start(root);
            }
            if (state.phase === 'pending') {
                state.pendingReplay = requestedSelectors;
                return true;
            }
            if (state.phase === 'active') {
                resetForReplay(root);
            }
            return startReadyLateNodes(root, state.generation, requestedSelectors, true);
        }

        function waitForLateAssembly(root, generation) {
            const startedAt = Date.now();
            return new Promise((resolve) => {
                const poll = () => {
                    if (state.root !== root || state.generation !== generation) {
                        resolve();
                        return;
                    }
                    startLateNodes(root, generation);
                    const elapsed = Date.now() - startedAt;
                    const hasActiveNodes = Array.from(state.nodeStatus.values())
                        .some((status) => status === 'active');
                    if (
                        elapsed >= timing.maxAssemblyWindowMs
                        || (elapsed >= timing.lateAssemblyGraceMs && !hasActiveNodes && !state.lateRuns.size)
                    ) {
                        resolve();
                        return;
                    }
                    state.waitTimer = window.setTimeout(poll, 32);
                };
                poll();
            });
        }

        function run(root, generation) {
            if (state.root !== root || state.generation !== generation) return;
            root.dataset[rootStateDataset] = 'active';
            state.phase = 'active';
            const reduceMotion = Boolean(
                window.matchMedia
                && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            );
            state.reducedMotion = reduceMotion;
            state.animationSupported = isAnimationSupported();
            recordEvent(reduceMotion ? 'reduced-motion' : 'running');
            const tree = getAssemblyTree(root);
            registerStructures(root);
            registerTree(tree);
            tree.nodes.forEach((node) => node.element.classList.add(classes.staging));
            if (reduceMotion || !state.animationSupported) {
                finish(root, generation);
                return;
            }

            state.deadlineTimer = window.setTimeout(() => {
                finish(root, generation);
            }, timing.maxTotalAssemblyMs);
            runSiblings(tree.roots, root, generation)
                .then(() => waitForLateAssembly(root, generation))
                .then(() => finish(root, generation))
                .catch((error) => {
                    recordEvent('assembly-error', error);
                    finish(root, generation);
                });
        }

        function waitForShell(root, generation) {
            const startedAt = Date.now();
            const poll = () => {
                if (state.root !== root || state.generation !== generation) return;
                const elapsed = Date.now() - startedAt;
                const contentReady = isContentReady();
                const canStart = isSharedShellReady()
                    || !isSharedRevealActive();
                const shellTimedOut = elapsed >= timing.maxShellWaitMs;
                const contentTimedOut = elapsed >= contentWaitMaxMs;
                if ((canStart || shellTimedOut) && (contentReady || contentTimedOut)) {
                    state.waitTimer = 0;
                    run(root, generation);
                    return;
                }
                state.waitTimer = window.setTimeout(poll, 32);
            };
            poll();
        }

        function start(root = getPageRoot()) {
            if (!isRoute() || !root) return false;
            const targets = getTargets(root);
            if (!targets.length) return false;
            if (state.root === root && root.dataset[rootStateDataset]) return true;

            clearAnimationState();
            state.root = root;
            state.generation += 1;
            const generation = state.generation;
            state.phase = 'pending';
            state.targetCount = targets.length;
            recordEvent('pending');
            root.dataset[rootStateDataset] = 'pending';
            document.body?.classList.remove(classes.ready);
            document.body?.classList.add(classes.active);
            registerStructures(root);
            targets.forEach((target) => target.classList.add(classes.target, classes.staging));
            waitForShell(root, generation);
            return true;
        }

        function scheduleStart() {
            if (!autoStart) return;
            const currentRoot = getPageRoot();
            if (currentRoot && state.root && state.root !== currentRoot) {
                clearAnimationState();
                state.root = null;
                state.phase = 'idle';
                recordEvent('root-replaced');
            }
            if (state.phase === 'active' && state.root) {
                if (state.scheduleTimer) {
                    window.clearTimeout(state.scheduleTimer);
                    state.scheduleTimer = 0;
                }
                startLateNodes(state.root, state.generation);
                return;
            }
            if (state.phase === 'ready' && state.root && animateLateAfterReady && autoReplayLateMutations) {
                if (state.scheduleTimer) {
                    window.clearTimeout(state.scheduleTimer);
                    state.scheduleTimer = 0;
                }
                startReadyLateNodes(state.root, state.generation);
                return;
            }
            if (state.scheduleTimer) return;
            state.scheduleTimer = window.setTimeout(() => {
                state.scheduleTimer = 0;
                if (state.phase === 'active' && state.root) {
                    startLateNodes(state.root, state.generation);
                    return;
                }
                start();
            }, 0);
        }

        function install() {
            if (!isRoute()) return false;
            const observerRoot = getObserverRoot();
            if (!observerRoot) {
                window.setTimeout(install, 64);
                return false;
            }
            if (typeof MutationObserver === 'function' && !state.observer) {
                state.observer = new MutationObserver(scheduleStart);
                state.observer.observe(observerRoot, { childList: true, subtree: true });
            }
            recordEvent('installed');
            scheduleStart();
            return true;
        }

        return Object.freeze({
            start,
            install,
            replay,
            getTargets,
            getState: () => ({
                ...state,
                animations: state.animations.size,
                pendingReplay: Boolean(state.pendingReplay)
            })
        });
    }

    global.__kiuCreateAssemblyLoadingMotion = createAssemblyLoadingMotion;
})(window);
