/* LMS classroom/calls runtime extracted from lms.js. */

const lmsClassLocalMediaRuntime = {
    cameraStream: null,
    screenStream: null
};

function getLmsCurrentUserForCalls() {
    const user = getCurrentUser?.() || {};
    const role = getEffectiveUserRole();
    const id = String(getCurrentUserId?.() || user.id || `${role || 'user'}-local`);
    return {
        id,
        role,
        name: repairLmsDisplayText(user.nameEn || user.name || user.fullName || role || 'User', 'User')
    };
}

function canManageLmsClassSection(sectionType = getCurrentLmsSectionType()) {
    const role = getEffectiveUserRole();
    const normalized = normalizeLmsSectionType(sectionType) || getCurrentLmsSectionType();
    return role === USER_ROLES.ADMIN
        || (role === USER_ROLES.PROFESSOR && normalized === 'lecture')
        || (role === USER_ROLES.TA && normalized === 'workshop');
}

function normalizeLmsClassSession(session = {}, resourceKey = '') {
    const parsed = parseLmsCourseKey(resourceKey || session.resourceKey || '');
    const sectionType = normalizeLmsSectionType(session.sectionType || parsed.sectionType) || getCurrentLmsSectionType();
    const status = ['scheduled', 'active', 'ended'].includes(String(session.status || '').toLowerCase())
        ? String(session.status).toLowerCase()
        : 'scheduled';
    const participantIds = Array.isArray(session.participantIds)
        ? Array.from(new Set(session.participantIds.map(id => String(id)).filter(Boolean)))
        : [];
    const normalizeObject = (value) => (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
    const roomSettings = {
        layout: ['speaker', 'gallery', 'lecture', 'slides', 'whiteboard', 'code', 'exam', 'breakout', 'accessibility', 'focus'].includes(String(session.roomSettings?.layout || session.layoutMode || '').toLowerCase())
            ? String(session.roomSettings?.layout || session.layoutMode).toLowerCase()
            : 'lecture',
        locked: Boolean(session.roomSettings?.locked),
        lobbyEnabled: session.roomSettings?.lobbyEnabled !== false,
        studentMicDisabled: Boolean(session.roomSettings?.studentMicDisabled),
        studentCameraDisabled: Boolean(session.roomSettings?.studentCameraDisabled),
        screenShareAllowed: session.roomSettings?.screenShareAllowed !== false,
        recording: Boolean(session.roomSettings?.recording),
        captions: session.roomSettings?.captions !== false,
        transcript: session.roomSettings?.transcript !== false,
        lowBandwidth: Boolean(session.roomSettings?.lowBandwidth),
        audioOnly: Boolean(session.roomSettings?.audioOnly),
        adaptiveBitrate: session.roomSettings?.adaptiveBitrate !== false,
        noiseSuppression: session.roomSettings?.noiseSuppression !== false,
        echoCancellation: session.roomSettings?.echoCancellation !== false,
        autoGainControl: session.roomSettings?.autoGainControl !== false,
        backgroundBlur: Boolean(session.roomSettings?.backgroundBlur),
        virtualBackground: session.roomSettings?.virtualBackground || '',
        speakerDetection: session.roomSettings?.speakerDetection !== false,
        autoReconnect: session.roomSettings?.autoReconnect !== false,
        hdMode: Boolean(session.roomSettings?.hdMode),
        classStabilityMode: Boolean(session.roomSettings?.classStabilityMode),
        missedSeconds: Math.max(0, parseInt(session.roomSettings?.missedSeconds, 10) || 0),
        spotlightUserId: String(session.roomSettings?.spotlightUserId || ''),
        breakoutRooms: Math.max(0, parseInt(session.roomSettings?.breakoutRooms, 10) || 0),
        waitingCount: Math.max(0, parseInt(session.roomSettings?.waitingCount, 10) || 0)
    };
    const userStates = Object.entries(normalizeObject(session.userStates)).reduce((acc, [userId, state]) => {
        const userState = normalizeObject(state);
        acc[String(userId)] = {
            micMuted: userState.micMuted !== false,
            cameraOn: Boolean(userState.cameraOn),
            handRaised: Boolean(userState.handRaised),
            screenSharing: Boolean(userState.screenSharing),
            lowBandwidth: Boolean(userState.lowBandwidth),
            pictureInPicture: Boolean(userState.pictureInPicture),
            breakoutRoomId: String(userState.breakoutRoomId || ''),
            selectedMic: userState.selectedMic || 'Default microphone',
            selectedCamera: userState.selectedCamera || 'Default camera',
            selectedSpeaker: userState.selectedSpeaker || 'Default speaker',
            deviceTested: Boolean(userState.deviceTested),
            hdMode: Boolean(userState.hdMode),
            backgroundBlur: Boolean(userState.backgroundBlur),
            virtualBackground: userState.virtualBackground || '',
            privateNotes: String(userState.privateNotes || '')
        };
        return acc;
    }, {});
    const normalizeList = (value) => Array.isArray(value) ? value : [];
    return {
        id: session.id || `lms-call-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sectionType,
        title: repairLmsDisplayText(session.title || `${getLmsSectionMeta(sectionType).label} online lesson`, `${getLmsSectionMeta(sectionType).label} online lesson`),
        topic: repairLmsDisplayText(session.topic || session.title || `${getLmsSectionMeta(sectionType).label} session`, `${getLmsSectionMeta(sectionType).label} session`),
        weekLabel: normalizeLmsWeekLabel(session.weekLabel || ''),
        lessonMode: ['lecture', 'seminar', 'coding', 'math', 'whiteboard', 'exam'].includes(String(session.lessonMode || '').toLowerCase())
            ? String(session.lessonMode).toLowerCase()
            : (sectionType === 'workshop' ? 'seminar' : 'lecture'),
        status,
        hostUserId: String(session.hostUserId || ''),
        hostRole: session.hostRole || '',
        startedAt: session.startedAt || null,
        endedAt: session.endedAt || null,
        scheduledAt: session.scheduledAt || null,
        participantIds,
        maxParticipants: Math.min(200, Math.max(1, parseInt(session.maxParticipants, 10) || 200)),
        callChatId: session.callChatId || `lms-class-${toDomToken(resourceKey)}-${session.id || Date.now()}`,
        resourceKey: resourceKey || session.resourceKey || '',
        roomSettings,
        userStates,
        attendanceEvents: normalizeList(session.attendanceEvents),
        reactions: normalizeList(session.reactions).slice(-24),
        chatMessages: normalizeList(session.chatMessages).slice(-80),
        questions: normalizeList(session.questions),
        activities: normalizeList(session.activities),
        breakoutRooms: normalizeList(session.breakoutRooms),
        lobbyUserIds: normalizeList(session.lobbyUserIds).map(id => String(id)).filter(Boolean),
        materials: normalizeList(session.materials).length ? normalizeList(session.materials) : [
            { id: 'slides', title: 'Lecture slides', type: 'slides', downloadable: true },
            { id: 'reading', title: 'Required reading', type: 'document', downloadable: true }
        ],
        transcript: normalizeList(session.transcript).length ? normalizeList(session.transcript) : [
            { at: session.startedAt || new Date().toISOString(), speaker: session.hostRole || 'Instructor', text: 'Transcript stream will appear here when captions/transcription is connected.' }
        ],
        studyPackage: normalizeObject(session.studyPackage)
    };
}

function ensureLmsClassSessionsForKey(resourceKey) {
    ensureLmsStores();
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!Array.isArray(KIU_STATE.lmsClassSessions[canonicalKey])) {
        KIU_STATE.lmsClassSessions[canonicalKey] = [];
    }
    KIU_STATE.lmsClassSessions[canonicalKey] = KIU_STATE.lmsClassSessions[canonicalKey]
        .map(session => normalizeLmsClassSession(session, canonicalKey));
    return KIU_STATE.lmsClassSessions[canonicalKey];
}

function findLmsClassSession(sessionId) {
    ensureLmsStores();
    const targetId = String(sessionId || '');
    for (const [resourceKey, sessions] of Object.entries(KIU_STATE.lmsClassSessions || {})) {
        if (!Array.isArray(sessions)) continue;
        const index = sessions.findIndex(session => String(session.id) === targetId);
        if (index >= 0) {
            sessions[index] = normalizeLmsClassSession(sessions[index], resourceKey);
            return { resourceKey, sessions, session: sessions[index], index };
        }
    }
    return null;
}

function getLmsParticipantName(userId, parsed) {
    const domain = getDomain?.();
    const user = domain?.usersById?.[String(userId)] || null;
    if (user) return repairLmsDisplayText(user.nameEn || user.name || user.email || userId, userId);
    const student = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId)
        .find(item => String(item.id) === String(userId));
    return repairLmsDisplayText(student?.name || userId, userId);
}

function getLmsCallUserState(session, userId = getLmsCurrentUserForCalls().id) {
    const key = String(userId || '');
    if (!session.userStates || typeof session.userStates !== 'object') session.userStates = {};
    if (!session.userStates[key]) {
        session.userStates[key] = {
            micMuted: true,
            cameraOn: false,
            handRaised: false,
            screenSharing: false,
            lowBandwidth: false,
            pictureInPicture: false,
            breakoutRoomId: '',
            selectedMic: 'Default microphone',
            selectedCamera: 'Default camera',
            selectedSpeaker: 'Default speaker',
            deviceTested: false,
            hdMode: false,
            backgroundBlur: false,
            virtualBackground: '',
            privateNotes: ''
        };
    }
    return session.userStates[key];
}

function addLmsCallAttendanceEvent(session, eventType, userId = getLmsCurrentUserForCalls().id) {
    if (!Array.isArray(session.attendanceEvents)) session.attendanceEvents = [];
    session.attendanceEvents.push({
        id: `att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        userId: String(userId || ''),
        eventType,
        at: new Date().toISOString()
    });
}

function getLmsCallAttendanceMinutes(session) {
    const started = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const ended = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
    if (!Number.isFinite(started) || !Number.isFinite(ended) || ended <= started) return 0;
    return Math.round((ended - started) / 60000);
}

function updateLmsClassSession(sessionId, updater) {
    const found = findLmsClassSession(sessionId);
    if (!found) return null;
    updater(found.session, found);
    found.sessions[found.index] = normalizeLmsClassSession(found.session, found.resourceKey);
    saveState();
    renderLmsCallsSection(found.resourceKey);
    return found.sessions[found.index];
}

function stopLmsMediaStream(stream) {
    try {
        stream?.getTracks?.().forEach(track => track.stop());
    } catch (error) {}
}

function getLmsClassMediaErrorMessage(error) {
    if (!error) return 'Device permission failed.';
    if (error.name === 'NotAllowedError') return 'Browser blocked camera or microphone permission.';
    if (error.name === 'NotFoundError') return 'No matching camera, microphone, or screen source was found.';
    if (error.name === 'NotReadableError') return 'The selected device is already in use.';
    return error.message || 'Device permission failed.';
}

async function requestLmsClassUserMedia(kind = 'both') {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support camera or microphone access.');
    }
    const constraints = {
        audio: kind === 'audio' || kind === 'both'
            ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            : false,
        video: kind === 'video' || kind === 'both'
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
            : false
    };
    return navigator.mediaDevices.getUserMedia(constraints);
}

async function testLmsClassDevices(sessionId) {
    try {
        const stream = await requestLmsClassUserMedia('both');
        const audioTrack = stream.getAudioTracks?.()[0];
        const videoTrack = stream.getVideoTracks?.()[0];
        updateLmsClassSession(sessionId, (session) => {
            const state = getLmsCallUserState(session);
            state.deviceTested = true;
            state.selectedMic = audioTrack?.label || 'Microphone ready';
            state.selectedCamera = videoTrack?.label || 'Camera ready';
        });
        stopLmsMediaStream(stream);
    } catch (error) {
        alert(getLmsClassMediaErrorMessage(error));
    }
}

function setLmsClassLayout(sessionId, layout) {
    const normalized = ['speaker', 'gallery', 'lecture', 'slides', 'whiteboard', 'code', 'exam', 'breakout', 'accessibility', 'focus'].includes(String(layout || '').toLowerCase())
        ? String(layout).toLowerCase()
        : 'lecture';
    updateLmsClassSession(sessionId, (session) => {
        session.roomSettings.layout = normalized;
    });
}

async function toggleLmsClassUserControl(sessionId, control) {
    if (control === 'testDevices') {
        await testLmsClassDevices(sessionId);
        return;
    }
    const found = findLmsClassSession(sessionId);
    const currentState = found ? getLmsCallUserState(found.session) : null;
    if (control === 'mic' && currentState?.micMuted && !lmsClassLocalMediaRuntime.cameraStream?.getAudioTracks?.().length) {
        try {
            const audioStream = await requestLmsClassUserMedia('audio');
            lmsClassLocalMediaRuntime.cameraStream = audioStream;
        } catch (error) {
            alert(getLmsClassMediaErrorMessage(error));
            return;
        }
    }
    if (control === 'mic' && currentState?.micMuted) {
        lmsClassLocalMediaRuntime.cameraStream?.getAudioTracks?.().forEach(track => { track.enabled = true; });
    }
    if (control === 'mic' && !currentState?.micMuted) {
        lmsClassLocalMediaRuntime.cameraStream?.getAudioTracks?.().forEach(track => { track.enabled = false; });
    }
    if (control === 'camera' && !currentState?.cameraOn) {
        try {
            const cameraStream = await requestLmsClassUserMedia('both');
            stopLmsMediaStream(lmsClassLocalMediaRuntime.cameraStream);
            lmsClassLocalMediaRuntime.cameraStream = cameraStream;
        } catch (error) {
            alert(getLmsClassMediaErrorMessage(error));
            return;
        }
    }
    if (control === 'camera' && currentState?.cameraOn) {
        lmsClassLocalMediaRuntime.cameraStream?.getVideoTracks?.().forEach(track => track.stop());
    }
    if (control === 'share' && !currentState?.screenSharing) {
        try {
            if (!navigator.mediaDevices?.getDisplayMedia) {
                throw new Error('This browser does not support screen sharing.');
            }
            stopLmsMediaStream(lmsClassLocalMediaRuntime.screenStream);
            lmsClassLocalMediaRuntime.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            lmsClassLocalMediaRuntime.screenStream.getVideoTracks?.().forEach(track => {
                track.onended = () => {
                    updateLmsClassSession(sessionId, (session) => {
                        getLmsCallUserState(session).screenSharing = false;
                    });
                };
            });
        } catch (error) {
            alert(getLmsClassMediaErrorMessage(error));
            return;
        }
    }
    if (control === 'share' && currentState?.screenSharing) {
        stopLmsMediaStream(lmsClassLocalMediaRuntime.screenStream);
        lmsClassLocalMediaRuntime.screenStream = null;
    }
    updateLmsClassSession(sessionId, (session) => {
        const state = getLmsCallUserState(session);
        if (control === 'mic') state.micMuted = !state.micMuted;
        if (control === 'camera') state.cameraOn = !state.cameraOn;
        if (control === 'hand') state.handRaised = !state.handRaised;
        if (control === 'share' && session.roomSettings.screenShareAllowed) state.screenSharing = !state.screenSharing;
        if (control === 'lowBandwidth') state.lowBandwidth = !state.lowBandwidth;
        if (control === 'pip') state.pictureInPicture = !state.pictureInPicture;
        if (control === 'hd') state.hdMode = !state.hdMode;
        if (control === 'blur') state.backgroundBlur = !state.backgroundBlur;
        if (control === 'virtualBackground') state.virtualBackground = state.virtualBackground ? '' : 'University background';
        if (control === 'switchDevice') {
            state.selectedMic = state.selectedMic === 'Default microphone' ? 'Backup microphone' : 'Default microphone';
            state.selectedCamera = state.selectedCamera === 'Default camera' ? 'Backup camera' : 'Default camera';
            state.selectedSpeaker = state.selectedSpeaker === 'Default speaker' ? 'Headphones' : 'Default speaker';
        }
    });
}

function toggleLmsClassRoomSetting(sessionId, setting) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) {
            alert('You do not have permission to manage this classroom.');
            return;
        }
        if (setting === 'muteAll') {
            Object.values(session.userStates || {}).forEach(state => { state.micMuted = true; });
            session.roomSettings.studentMicDisabled = true;
        } else if (setting === 'disableMics') {
            session.roomSettings.studentMicDisabled = !session.roomSettings.studentMicDisabled;
        } else if (setting === 'disableCameras') {
            session.roomSettings.studentCameraDisabled = !session.roomSettings.studentCameraDisabled;
        } else if (setting === 'lock') {
            session.roomSettings.locked = !session.roomSettings.locked;
        } else if (setting === 'lobby') {
            session.roomSettings.lobbyEnabled = !session.roomSettings.lobbyEnabled;
        } else if (setting === 'recording') {
            session.roomSettings.recording = !session.roomSettings.recording;
        } else if (setting === 'captions') {
            session.roomSettings.captions = !session.roomSettings.captions;
        } else if (setting === 'transcript') {
            session.roomSettings.transcript = !session.roomSettings.transcript;
        } else if (setting === 'lowBandwidth') {
            session.roomSettings.lowBandwidth = !session.roomSettings.lowBandwidth;
        } else if (setting === 'audioOnly') {
            session.roomSettings.audioOnly = !session.roomSettings.audioOnly;
        } else if (setting === 'screenShare') {
            session.roomSettings.screenShareAllowed = !session.roomSettings.screenShareAllowed;
        } else if (setting === 'hdMode') {
            session.roomSettings.hdMode = !session.roomSettings.hdMode;
        } else if (setting === 'backgroundBlur') {
            session.roomSettings.backgroundBlur = !session.roomSettings.backgroundBlur;
        } else if (setting === 'virtualBackground') {
            session.roomSettings.virtualBackground = session.roomSettings.virtualBackground ? '' : 'University background';
        } else if (setting === 'classStability') {
            session.roomSettings.classStabilityMode = !session.roomSettings.classStabilityMode;
            session.roomSettings.lowBandwidth = session.roomSettings.classStabilityMode;
            session.roomSettings.missedSeconds = session.roomSettings.classStabilityMode ? Math.max(session.roomSettings.missedSeconds || 0, 38) : 0;
        }
    });
}

function sendLmsClassReaction(sessionId, reaction) {
    updateLmsClassSession(sessionId, (session) => {
        if (!Array.isArray(session.reactions)) session.reactions = [];
        const user = getLmsCurrentUserForCalls();
        session.reactions.push({
            id: `react-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            userId: user.id,
            name: user.name,
            reaction: String(reaction || 'like').slice(0, 24),
            at: new Date().toISOString()
        });
        session.reactions = session.reactions.slice(-24);
    });
}

function askLmsClassQuestion(sessionId) {
    const input = document.getElementById(`lms-call-question-${toDomToken(sessionId)}`);
    const anonymous = document.getElementById(`lms-call-anonymous-${toDomToken(sessionId)}`)?.checked;
    const text = String(input?.value || '').trim();
    if (!text) return;
    updateLmsClassSession(sessionId, (session) => {
        if (!Array.isArray(session.questions)) session.questions = [];
        const user = getLmsCurrentUserForCalls();
        session.questions.push({
            id: `question-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            userId: user.id,
            name: anonymous ? 'Anonymous student' : user.name,
            text,
            anonymous: Boolean(anonymous),
            answered: false,
            at: new Date().toISOString()
        });
    });
}

function markLmsClassQuestionAnswered(sessionId, questionId) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) return;
        const question = (session.questions || []).find(item => String(item.id) === String(questionId));
        if (question) question.answered = true;
    });
}

function saveLmsClassPrivateNotes(sessionId) {
    const input = document.getElementById(`lms-call-notes-${toDomToken(sessionId)}`);
    updateLmsClassSession(sessionId, (session) => {
        getLmsCallUserState(session).privateNotes = String(input?.value || '').slice(0, 2000);
    });
}

function launchLmsClassActivity(sessionId, activityType) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) {
            alert('You do not have permission to launch class activities.');
            return;
        }
        if (!Array.isArray(session.activities)) session.activities = [];
        const normalizedType = ['poll', 'quiz', 'breakout', 'whiteboard', 'file'].includes(String(activityType || '').toLowerCase())
            ? String(activityType).toLowerCase()
            : 'poll';
        if (normalizedType === 'breakout') {
            session.roomSettings.breakoutRooms = Math.max(1, session.roomSettings.breakoutRooms || 4);
        }
        if (normalizedType === 'whiteboard') {
            session.roomSettings.layout = 'whiteboard';
        }
        session.activities.unshift({
            id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type: normalizedType,
            title: normalizedType === 'poll' ? 'Quick poll'
                : normalizedType === 'quiz' ? 'Live quiz'
                    : normalizedType === 'breakout' ? 'Breakout rooms'
                        : normalizedType === 'whiteboard' ? 'Shared whiteboard'
                            : 'Shared class material',
            status: 'ready',
            createdAt: new Date().toISOString(),
            responses: {}
        });
    });
    if (String(activityType || '').toLowerCase() === 'whiteboard' && typeof openLmsWhiteboardFromCalls === 'function') {
        openLmsWhiteboardFromCalls({ unlock: true });
    }
}

function sendLmsClassChatMessage(sessionId) {
    const input = document.getElementById(`lms-call-chat-${toDomToken(sessionId)}`);
    const text = String(input?.value || '').trim();
    if (!text) return;
    updateLmsClassSession(sessionId, (session) => {
        const user = getLmsCurrentUserForCalls();
        if (!Array.isArray(session.chatMessages)) session.chatMessages = [];
        session.chatMessages.push({
            id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            userId: user.id,
            name: user.name,
            text,
            at: new Date().toISOString()
        });
        session.chatMessages = session.chatMessages.slice(-80);
    });
}

function answerLmsClassActivity(sessionId, activityId, answer = 'answered') {
    updateLmsClassSession(sessionId, (session) => {
        const user = getLmsCurrentUserForCalls();
        const activity = (session.activities || []).find(item => String(item.id) === String(activityId));
        if (!activity) return;
        if (!activity.responses || typeof activity.responses !== 'object') activity.responses = {};
        activity.responses[user.id] = {
            answer,
            at: new Date().toISOString()
        };
    });
}

function joinLmsBreakoutRoom(sessionId, roomId) {
    updateLmsClassSession(sessionId, (session) => {
        getLmsCallUserState(session).breakoutRoomId = String(roomId || 'room-1');
    });
}

function moveLmsBreakoutParticipant(sessionId, userId, roomId) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) return;
        getLmsCallUserState(session, userId).breakoutRoomId = String(roomId || 'room-1');
    });
}

function broadcastLmsBreakoutMessage(sessionId) {
    const input = document.getElementById(`lms-call-broadcast-${toDomToken(sessionId)}`);
    const text = String(input?.value || '').trim() || 'Broadcast message to all breakout rooms.';
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) return;
        if (!Array.isArray(session.chatMessages)) session.chatMessages = [];
        session.chatMessages.push({
            id: `broadcast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            userId: session.hostUserId || 'host',
            name: 'Broadcast',
            text,
            at: new Date().toISOString()
        });
    });
}

function admitLmsClassWaitingStudent(sessionId) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) return;
        if (!Array.isArray(session.lobbyUserIds)) session.lobbyUserIds = [];
        const admittedId = session.lobbyUserIds.shift() || `waiting-${Date.now()}`;
        session.roomSettings.waitingCount = Math.max(0, (session.roomSettings.waitingCount || 0) - 1);
        if (!session.participantIds.includes(admittedId)) session.participantIds.push(admittedId);
        getLmsCallUserState(session, admittedId);
        addLmsCallAttendanceEvent(session, 'admit', admittedId);
    });
}

function removeLmsClassParticipant(sessionId, userId) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) return;
        const targetId = String(userId || session.participantIds.find(id => String(id) !== String(session.hostUserId)) || '');
        if (!targetId) return;
        session.participantIds = session.participantIds.filter(id => String(id) !== targetId);
        addLmsCallAttendanceEvent(session, 'remove', targetId);
    });
}

function spotlightLmsClassParticipant(sessionId, userId) {
    updateLmsClassSession(sessionId, (session) => {
        if (!canManageLmsClassSection(session.sectionType)) return;
        const targetId = String(userId || session.participantIds[0] || '');
        session.roomSettings.spotlightUserId = session.roomSettings.spotlightUserId === targetId ? '' : targetId;
    });
}

function exportLmsClassTranscript(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    const rows = (found.session.transcript || []).map(item => `[${item.at || ''}] ${item.speaker || 'Speaker'}: ${item.text || ''}`);
    const blob = new Blob([rows.join('\n') || 'Transcript export is ready for the transcription service.'], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${toDomToken(found.session.title)}-transcript.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function downloadLmsClassMaterial(sessionId, materialId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    const material = (found.session.materials || []).find(item => String(item.id) === String(materialId))
        || { title: 'Class material', type: 'text' };
    const content = `${material.title || 'Class material'}\n\nLocal LMS material export for ${found.session.title}.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${toDomToken(material.title || 'class-material')}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportLmsClassAttendance(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    const rows = ['userId,eventType,at', ...(found.session.attendanceEvents || []).map(item => `${item.userId || ''},${item.eventType || ''},${item.at || ''}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${toDomToken(found.session.title)}-attendance.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function createLmsAssignmentFromCall(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    const assignments = ensureLmsAssignmentsForKey(found.resourceKey);
    assignments.unshift({
        id: `asm-call-${Date.now()}`,
        title: `Follow-up: ${found.session.title}`,
        description: 'Assignment draft created from class call content.',
        deadline: '',
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUserId?.() || '',
        sourceCallId: found.session.id
    });
    saveState();
    alert('Assignment draft created from this class call.');
}

function catchUpLmsClassStability(sessionId) {
    updateLmsClassSession(sessionId, (session) => {
        session.roomSettings.missedSeconds = 0;
    });
}

function buildLmsCallSessionCard(session, resourceKey, parsed) {
    const sectionMeta = getLmsSectionMeta(session.sectionType);
    const currentUser = getLmsCurrentUserForCalls();
    const canManage = canManageLmsClassSection(session.sectionType);
    const isParticipant = session.participantIds.includes(currentUser.id);
    const userState = getLmsCallUserState(session, currentUser.id);
    const token = toDomToken(session.id);
    const statusLabel = session.status === 'active' ? 'Live now' : (session.status === 'ended' ? 'Ended' : 'Scheduled');
    const statusIcon = session.status === 'active' ? 'fa-circle-play' : (session.status === 'ended' ? 'fa-circle-check' : 'fa-clock');
    const scheduledLabel = session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'No scheduled time';
    const startedLabel = session.startedAt ? new Date(session.startedAt).toLocaleString() : 'Not started';
    const endedLabel = session.endedAt ? new Date(session.endedAt).toLocaleString() : '';
    const raisedHands = Object.values(session.userStates || {}).filter(state => state?.handRaised).length;
    const questionCount = (session.questions || []).filter(item => !item.answered).length;
    const attendanceMinutes = getLmsCallAttendanceMinutes(session);
    const participantMarkup = session.participantIds.length
        ? session.participantIds.slice(0, 8).map(id => {
            const name = getLmsParticipantName(id, parsed);
            const state = getLmsCallUserState(session, id);
            return `
                <span class="lms-call-person">
                    <span class="lms-call-avatar">${escapeHtml(String(name || '?').charAt(0).toUpperCase() || '?')}</span>
                    <span>${escapeHtml(name)}</span>
                    <em>${state.handRaised ? 'Hand raised' : (state.screenSharing ? 'Sharing' : (state.cameraOn ? 'Camera on' : (state.micMuted ? 'Mic muted' : 'Audio on')))}</em>
                </span>
            `;
        }).join('')
        : '<div class="lms-route-copy">No participants joined yet.</div>';
    const joinButton = session.status === 'active'
        ? (isParticipant
            ? `<button class="lux-secondary-btn" data-lms-click="leaveLmsClassCall(${lmsInlineArg(session.id)})"><i class="fas fa-arrow-right-from-bracket"></i> Leave</button>`
            : `<button class="lux-primary-btn" data-lms-click="joinLmsClassCall(${lmsInlineArg(session.id)})"><i class="fas fa-right-to-bracket"></i> Join</button>`)
        : '';
    const startButton = canManage && session.status === 'scheduled'
        ? `<button class="lux-primary-btn" data-lms-click="startLmsScheduledClassCall(${lmsInlineArg(session.id)})"><i class="fas fa-circle-play"></i> Start now</button>`
        : '';
    const endButton = canManage && session.status === 'active'
        ? `<button class="lux-secondary-btn" data-lms-click="endLmsClassCall(${lmsInlineArg(session.id)})"><i class="fas fa-stop"></i> End</button>`
        : '';
    const buildControl = (icon, label, action, active = false, disabled = false, meta = '') => `
        <button type="button" class="lms-call-control${active ? ' is-active' : ''}" ${disabled ? 'disabled' : ''} data-lms-click="${escapeHtml(action)}">
            <i class="fas ${escapeHtml(icon)}"></i>
            <span>${escapeHtml(label)}</span>
            <em>${escapeHtml(meta)}</em>
        </button>
    `;
    const teacherControls = [
        buildControl('fa-users-slash', 'Mute all', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'muteAll')`, session.roomSettings.studentMicDisabled, session.status !== 'active', 'Mute everyone and disable student microphones'),
        buildControl('fa-microphone-slash', 'Block mics', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'disableMics')`, session.roomSettings.studentMicDisabled, session.status !== 'active', 'Disable student microphones'),
        buildControl('fa-video-slash', 'Block cams', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'disableCameras')`, session.roomSettings.studentCameraDisabled, session.status !== 'active', 'Disable student cameras'),
        buildControl('fa-lock', session.roomSettings.locked ? 'Locked' : 'Lock room', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'lock')`, session.roomSettings.locked, session.status !== 'active', 'Lock meeting'),
        buildControl('fa-door-open', 'Lobby', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'lobby')`, session.roomSettings.lobbyEnabled, session.status !== 'active', 'Waiting room or lobby'),
        buildControl('fa-record-vinyl', 'Record', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'recording')`, session.roomSettings.recording, session.status !== 'active', 'Start or stop recording'),
        buildControl('fa-closed-captioning', 'Captions', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'captions')`, session.roomSettings.captions, session.status !== 'active', 'Live captions prepared'),
        buildControl('fa-file-lines', 'Transcript', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'transcript')`, session.roomSettings.transcript, session.status !== 'active', 'Transcript prepared'),
        buildControl('fa-headphones', 'Audio only', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'audioOnly')`, session.roomSettings.audioOnly, session.status !== 'active', 'Audio-only stability mode'),
        buildControl('fa-display', 'Share gate', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'screenShare')`, session.roomSettings.screenShareAllowed, session.status !== 'active', 'Allow or block student screen sharing'),
        buildControl('fa-gauge', 'HD', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'hdMode')`, session.roomSettings.hdMode, session.status !== 'active', 'HD mode for strong connections'),
        buildControl('fa-shield-heart', 'Stability', `toggleLmsClassRoomSetting(${lmsInlineArg(session.id)}, 'classStability')`, session.roomSettings.classStabilityMode, session.status !== 'active', 'Class Stability Mode')
    ].join('');
    const userControls = [
        buildControl('fa-microphone', userState.micMuted ? 'Unmute' : 'Mute', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'mic')`, !userState.micMuted, session.status !== 'active', userState.selectedMic),
        buildControl('fa-camera', userState.cameraOn ? 'Stop camera' : 'Start camera', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'camera')`, userState.cameraOn, session.status !== 'active' || session.roomSettings.studentCameraDisabled, userState.selectedCamera),
        buildControl('fa-hand', userState.handRaised ? 'Lower hand' : 'Raise hand', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'hand')`, userState.handRaised, session.status !== 'active', raisedHands ? `${raisedHands} waiting` : 'Ask to speak'),
        buildControl('fa-desktop', userState.screenSharing ? 'Stop share' : 'Share screen', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'share')`, userState.screenSharing, session.status !== 'active' || !session.roomSettings.screenShareAllowed, userState.screenSharing ? 'Sharing now' : 'Share content'),
        buildControl('fa-wifi', userState.lowBandwidth ? 'Balanced mode' : 'Low bandwidth', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'lowBandwidth')`, userState.lowBandwidth, session.status !== 'active', userState.lowBandwidth ? 'Stability first' : 'Standard quality'),
        buildControl('fa-arrows-left-right-to-line', userState.pictureInPicture ? 'Exit PiP' : 'Picture-in-picture', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'pip')`, userState.pictureInPicture, session.status !== 'active', 'Keep notes visible'),
        buildControl('fa-sparkles', userState.hdMode ? 'HD on' : 'Enable HD', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'hd')`, userState.hdMode, session.status !== 'active', userState.hdMode ? 'High detail' : 'Reduce blur'),
        buildControl('fa-images', userState.virtualBackground ? 'Clear background' : 'Virtual background', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'virtualBackground')`, Boolean(userState.virtualBackground), session.status !== 'active', userState.virtualBackground || 'Use university background'),
        buildControl('fa-sliders', 'Switch devices', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'switchDevice')`, false, session.status !== 'active', userState.selectedSpeaker),
        buildControl('fa-vial', 'Device test', `toggleLmsClassUserControl(${lmsInlineArg(session.id)}, 'testDevices')`, userState.deviceTested, session.status !== 'active', userState.deviceTested ? 'Passed' : 'Check mic/cam')
    ].join('');
    const layoutButtons = [
        ['lecture', 'fa-person-chalkboard', 'Lecture'],
        ['seminar', 'fa-comments', 'Seminar'],
        ['whiteboard', 'fa-chalkboard', 'Board'],
        ['coding', 'fa-code', 'Code'],
        ['exam', 'fa-shield-halved', 'Exam'],
        ['breakout', 'fa-people-arrows', 'Breakouts']
    ].map(([layout, icon, label]) => `
        <button type="button" class="lms-call-layout-btn${session.roomSettings.layout === layout ? ' is-active' : ''}" data-lms-click="setLmsClassLayout(${lmsInlineArg(session.id)}, '${layout}')">
            <i class="fas ${icon}"></i>
            <span>${label}</span>
        </button>
    `).join('');
    const activityCards = (session.activities || []).length
        ? session.activities.map(activity => {
            const responseCount = Object.keys(activity.responses || {}).length;
            const canAnswer = session.status === 'active' && !canManage;
            return `
                <div class="lms-call-activity-card">
                    <div class="lms-call-activity-top">
                        <div>
                            <strong>${escapeHtml(activity.title || 'Class activity')}</strong>
                            <span>${escapeHtml(activity.type || 'activity')} - ${escapeHtml(activity.status || 'ready')}</span>
                        </div>
                        <em>${responseCount} responses</em>
                    </div>
                    <div class="lms-call-activity-actions">
                        ${canManage ? `
                            <button type="button" class="lms-call-mini-action" data-lms-click="launchLmsClassActivity(${lmsInlineArg(session.id)}, '${escapeHtml(activity.type || 'poll')}')">Duplicate</button>
                        ` : ''}
                        ${canAnswer ? `
                            <button type="button" class="lms-call-mini-action" data-lms-click="answerLmsClassActivity(${lmsInlineArg(session.id)}, ${lmsInlineArg(activity.id)}, 'completed')">Answer</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="lms-route-copy">No live activities yet for this class.</div>';
    const breakoutRoomsMarkup = Array.from({ length: Math.max(1, session.roomSettings.breakoutRooms || 1) }, (_, index) => {
        const roomId = `room-${index + 1}`;
        const participants = session.participantIds.filter(id => getLmsCallUserState(session, id).breakoutRoomId === roomId);
        return `
            <div class="lms-call-breakout-room">
                <div>
                    <strong>Room ${index + 1}</strong>
                    <span>${participants.length} participant${participants.length === 1 ? '' : 's'}</span>
                </div>
                <div class="lms-call-chip-row">
                    ${participants.length ? participants.map(id => `<span class="lms-call-chip">${escapeHtml(getLmsParticipantName(id, parsed))}</span>`).join('') : '<span class="lms-call-chip">Open</span>'}
                </div>
                ${!canManage && session.status === 'active' ? `<button type="button" class="lms-call-mini-action" data-lms-click="joinLmsBreakoutRoom(${lmsInlineArg(session.id)}, '${roomId}')">Join room</button>` : ''}
            </div>
        `;
    }).join('');
    const questionList = (session.questions || []).length
        ? session.questions.slice(-6).reverse().map(item => `
            <div class="lms-call-question-item${item.answered ? ' is-answered' : ''}">
                <div>
                    <strong>${escapeHtml(item.name || 'Student')}</strong>
                    <span>${escapeHtml(item.text || '')}</span>
                </div>
                ${canManage && !item.answered ? `<button type="button" class="lms-call-mini-action" data-lms-click="markLmsClassQuestionAnswered(${lmsInlineArg(session.id)}, ${lmsInlineArg(item.id)})">Answered</button>` : '<span class="lms-call-chip">Done</span>'}
            </div>
        `).join('')
        : '<div class="lms-route-copy">No questions asked yet.</div>';
    const reactionFeed = (session.reactions || []).slice(-6).reverse().map(item => `
        <span class="lms-call-feed-item">
            <strong>${escapeHtml(item.name || 'Student')}</strong> ${escapeHtml(item.reaction || 'reacted')}
        </span>
    `).join('') || '<span class="lms-call-feed-item">No reactions yet.</span>';
    const chatFeed = (session.chatMessages || []).slice(-8).reverse().map(item => `
        <span class="lms-call-feed-item">
            <strong>${escapeHtml(item.name || 'User')}</strong>: ${escapeHtml(item.text || '')}
        </span>
    `).join('') || '<span class="lms-call-feed-item">Class chat is empty.</span>';
    const teacherActionBar = canManage ? `
        <div class="lms-call-action-bar">
            <button type="button" class="lux-secondary-btn" data-lms-click="launchLmsClassActivity(${lmsInlineArg(session.id)}, 'poll')"><i class="fas fa-chart-pie"></i> Poll</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="launchLmsClassActivity(${lmsInlineArg(session.id)}, 'quiz')"><i class="fas fa-list-check"></i> Quiz</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="launchLmsClassActivity(${lmsInlineArg(session.id)}, 'whiteboard')"><i class="fas fa-chalkboard"></i> Whiteboard</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="openLmsWhiteboardFromCalls()"><i class="fas fa-up-right-from-square"></i> Open board tab</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="launchLmsClassActivity(${lmsInlineArg(session.id)}, 'breakout')"><i class="fas fa-people-arrows"></i> Breakouts</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="admitLmsClassWaitingStudent(${lmsInlineArg(session.id)})"><i class="fas fa-user-check"></i> Admit lobby</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="exportLmsClassAttendance(${lmsInlineArg(session.id)})"><i class="fas fa-file-arrow-down"></i> Attendance</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="exportLmsClassTranscript(${lmsInlineArg(session.id)})"><i class="fas fa-file-lines"></i> Transcript</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="createLmsAssignmentFromCall(${lmsInlineArg(session.id)})"><i class="fas fa-square-plus"></i> Homework draft</button>
        </div>
    ` : `
        <div class="lms-call-action-bar">
            <button type="button" class="lux-secondary-btn" data-lms-click="sendLmsClassReaction(${lmsInlineArg(session.id)}, '👍')"><i class="fas fa-thumbs-up"></i> React</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="sendLmsClassReaction(${lmsInlineArg(session.id)}, '👏')"><i class="fas fa-hands-clapping"></i> Clap</button>
            <button type="button" class="lux-secondary-btn" data-lms-click="sendLmsClassReaction(${lmsInlineArg(session.id)}, '❓')"><i class="fas fa-circle-question"></i> Question</button>
        </div>
    `;
    const featureTiles = `
        <div class="lms-call-stat-grid">
            <div class="lms-call-stat">
                <span>Participants</span>
                <strong>${session.participantIds.length}</strong>
                <small>Joined roster</small>
            </div>
            <div class="lms-call-stat">
                <span>Questions</span>
                <strong>${questionCount}</strong>
                <small>Waiting for answer</small>
            </div>
            <div class="lms-call-stat">
                <span>Hands</span>
                <strong>${raisedHands}</strong>
                <small>Raised now</small>
            </div>
            <div class="lms-call-stat">
                <span>Attendance</span>
                <strong>${attendanceMinutes}</strong>
                <small>Minutes tracked</small>
            </div>
        </div>
    `;
    const launchControls = session.status === 'active' ? `
        <div class="lms-call-stage-grid">
            <div class="lms-route-card lms-route-panel-compact lms-call-stage">
                <div class="lms-call-stage-header">
                    <div>
                        <strong>${escapeHtml(session.title)}</strong>
                        <span>${escapeHtml(session.topic || `${sectionMeta.label} session`)}</span>
                    </div>
                    <div class="lms-call-chip-row">
                        <span class="lms-call-chip">${escapeHtml(session.lessonMode)}</span>
                        <span class="lms-call-chip">${escapeHtml(session.weekLabel || 'No week')}</span>
                    </div>
                </div>
                <div class="lms-call-video-stage is-${escapeHtml(session.roomSettings.layout)}">
                    <div class="lms-call-speaker">
                        <div class="lms-call-video-card is-host">
                            <span class="lms-call-video-label">${escapeHtml(session.hostRole || 'Host')}</span>
                            <strong>${escapeHtml(getLmsParticipantName(session.hostUserId || currentUser.id, parsed) || currentUser.name)}</strong>
                            <span>${session.roomSettings.layout === 'slides' ? 'Slides on stage' : session.roomSettings.layout === 'whiteboard' ? 'Whiteboard on stage' : 'Primary camera'}</span>
                        </div>
                        <div class="lms-call-video-card is-share">
                            <span class="lms-call-video-label">${session.roomSettings.screenShareAllowed ? 'Shared stage' : 'Stage locked'}</span>
                            <strong>${session.roomSettings.layout === 'coding' ? 'Code editor / IDE share' : session.roomSettings.layout === 'exam' ? 'Exam monitoring panel' : session.roomSettings.layout === 'whiteboard' ? 'Collaborative whiteboard' : 'Presentation / shared board'}</strong>
                            <span>${session.roomSettings.audioOnly ? 'Audio-only stability mode enabled' : (session.roomSettings.lowBandwidth ? 'Low-bandwidth optimization on' : 'Video and content visible to participants')}</span>
                            ${session.roomSettings.layout === 'whiteboard' ? `<button type="button" class="lms-call-mini-action" data-lms-click="openLmsWhiteboardFromCalls()"><i class="fas fa-chalkboard"></i> Open full whiteboard</button>` : ''}
                        </div>
                    </div>
                    <div class="lms-call-gallery">
                        ${(session.participantIds.length ? session.participantIds : [currentUser.id]).slice(0, 6).map(id => {
                            const participantName = getLmsParticipantName(id, parsed);
                            const state = getLmsCallUserState(session, id);
                            const isSpotlight = session.roomSettings.spotlightUserId && String(session.roomSettings.spotlightUserId) === String(id);
                            return `
                                <button type="button" class="lms-call-participant-card${isSpotlight ? ' is-spotlight' : ''}" data-lms-click="spotlightLmsClassParticipant(${lmsInlineArg(session.id)}, ${lmsInlineArg(id)})">
                                    <span class="lms-call-avatar">${escapeHtml(String(participantName).charAt(0).toUpperCase() || '?')}</span>
                                    <strong>${escapeHtml(participantName)}</strong>
                                    <span>${state.cameraOn ? 'Camera on' : 'Camera off'} - ${state.micMuted ? 'Muted' : 'Speaking ready'}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            <aside class="lms-call-side-stack">
                <div class="lms-route-card lms-route-panel-compact lms-call-side-card">
                    <strong>Lesson tools</strong>
                    <div class="lms-call-chip-row">
                        <span class="lms-call-chip">${session.roomSettings.recording ? 'Recording on' : 'Recording off'}</span>
                        <span class="lms-call-chip">${session.roomSettings.captions ? 'Captions ready' : 'Captions off'}</span>
                        <span class="lms-call-chip">${session.roomSettings.transcript ? 'Transcript ready' : 'Transcript off'}</span>
                        <span class="lms-call-chip">${session.roomSettings.classStabilityMode ? 'Stability mode' : 'Standard mode'}</span>
                    </div>
                    <div class="lms-call-controls">${canManage ? teacherControls : userControls}</div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-side-card">
                    <strong>Live collaboration</strong>
                    <div class="lms-call-chip-row">
                        <span><b>${questionCount}</b> open questions</span>
                        <span><b>${session.activities.length}</b> activities</span>
                        <span><b>${session.reactions.length}</b> reactions</span>
                        <span><b>${attendanceMinutes}</b> min</span>
                    </div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-side-card">
                    <strong>Reactions</strong>
                    <div class="lms-call-chip-row">${(session.reactions || []).slice(-8).map(item => `<span class="lms-call-chip">${escapeHtml(item.reaction || '👍')}</span>`).join('') || '<span class="lms-call-chip">No reactions yet</span>'}</div>
                    <div class="lms-call-feed">${reactionFeed}</div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-side-card">
                    <strong>Transcript and catch-up</strong>
                    <div class="lms-call-feed">
                        ${(session.transcript || []).slice(-3).map(item => `<span class="lms-call-feed-item">${escapeHtml(item.speaker || 'Speaker')}: ${escapeHtml(item.text || '')}</span>`).join('')}
                    </div>
                    ${session.roomSettings.missedSeconds ? `<button type="button" class="lms-call-mini-action" data-lms-click="catchUpLmsClassStability(${lmsInlineArg(session.id)})">Catch up ${session.roomSettings.missedSeconds}s</button>` : ''}
                </div>
            </aside>
        </div>
    ` : '';
    const modePanel = `
        <div class="lms-call-mode-panel">
            <div class="lms-route-card lms-route-panel-compact">
                <strong>Lecture layout</strong>
                <span>Teacher tile, shared content, transcript, notes, and questions are ready for a standard class meeting.</span>
            </div>
            <div class="lms-route-card lms-route-panel-compact">
                <strong>Seminar layout</strong>
                <span>Gallery, speaker queue, group notes, and participation view match a discussion-style meeting.</span>
            </div>
            <div class="lms-route-card lms-route-panel-compact">
                <strong>Whiteboard/code layout</strong>
                <span>Shared board or code content stays central with teacher video and student answer space beside it.</span>
            </div>
        </div>
    `;
    const postClassSummary = session.status === 'ended' ? `
        <div class="lms-route-card lms-route-panel-compact lms-call-post">
            <div>
                <strong>Meeting recap</strong>
                <span>${escapeHtml(session.studyPackage?.summary || 'Class ended. Recording, transcript, and attendance exports are ready.')}</span>
            </div>
            <div class="lms-call-post-grid">
                <span><b>${escapeHtml(String(session.participantIds.length))}</b> participants</span>
                <span><b>${escapeHtml(String((session.chatMessages || []).length))}</b> chat messages</span>
                <span><b>${escapeHtml(String((session.questions || []).length))}</b> questions</span>
                <span><b>${escapeHtml(session.studyPackage?.recordingStatus || 'Recording ready')}</b></span>
            </div>
        </div>
    ` : '';

    return `
        <article class="lms-route-panel lms-route-panel-compact lms-call-classroom is-${escapeHtml(session.status)}">
            <div class="lms-route-card-head">
                <div>
                    <div class="lms-call-card-kicker">
                        <span><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                        <span><i class="fas ${statusIcon}"></i> ${escapeHtml(statusLabel)}</span>
                        <span><i class="fas fa-user-shield"></i> ${escapeHtml(session.roomSettings.lobbyEnabled ? 'Lobby on' : 'Direct entry')}</span>
                    </div>
                    <div class="lms-route-card-title lms-route-copy-mt-8">${escapeHtml(session.title)}</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">
                        Host: ${escapeHtml(session.hostRole || sectionMeta.ownerLabel || 'Instructor')} - Capacity ${session.maxParticipants} - Mode ${escapeHtml(session.lessonMode)}
                    </div>
                </div>
                <span class="lms-route-pill">${session.participantIds.length}/${session.maxParticipants} joined</span>
            </div>
            <div class="lms-call-meta-grid">
                ${renderLmsRouteKv('Scheduled', scheduledLabel)}
                ${renderLmsRouteKv('Started', startedLabel)}
                ${session.status === 'ended' ? renderLmsRouteKv('Ended', endedLabel || 'Ended') : renderLmsRouteKv('Room', 'LMS classroom')}
            </div>
            <div class="lms-call-layout-row">${layoutButtons}</div>
            ${launchControls}
            ${canManage ? `<div class="lms-call-control-section"><div class="lms-route-field-label">Teacher controls</div><div class="lms-call-controls" aria-label="Teacher class controls">${teacherControls}</div></div>` : ''}
            ${teacherActionBar}
            <div class="lms-call-feature-grid">${featureTiles}</div>
            ${modePanel}
            ${postClassSummary}
            <div class="lms-call-collab-grid">
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Chat</div>
                    <div class="lms-call-feed">${chatFeed}</div>
                    ${session.status === 'active' ? `
                        <div class="lms-call-question-form">
                            <input id="lms-call-chat-${token}" class="lms-route-input" type="text" placeholder="Message everyone in class">
                            <button type="button" class="lux-secondary-btn" data-lms-click="sendLmsClassChatMessage(${lmsInlineArg(session.id)})"><i class="fas fa-paper-plane"></i> Send</button>
                        </div>
                    ` : ''}
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Questions</div>
                    <div class="lms-call-question-list">${questionList}</div>
                    ${session.status === 'active' ? `
                        <div class="lms-call-question-form">
                            <input id="lms-call-question-${token}" class="lms-route-input" type="text" placeholder="Ask a question or use anonymous mode">
                            <label><input id="lms-call-anonymous-${token}" type="checkbox"> Ask anonymously</label>
                            <button type="button" class="lux-secondary-btn" data-lms-click="askLmsClassQuestion(${lmsInlineArg(session.id)})"><i class="fas fa-paper-plane"></i> Ask</button>
                        </div>
                    ` : ''}
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Private notes</div>
                    <textarea id="lms-call-notes-${token}" class="lms-route-textarea" placeholder="Private notes for this class">${escapeHtml(userState.privateNotes || '')}</textarea>
                    <button type="button" class="lux-secondary-btn" data-lms-click="saveLmsClassPrivateNotes(${lmsInlineArg(session.id)})"><i class="fas fa-save"></i> Save notes</button>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Transcript</div>
                    <div class="lms-call-feed">
                        ${(session.transcript || []).slice(-5).map(item => `<span class="lms-call-feed-item">${escapeHtml(item.speaker || 'Speaker')}: ${escapeHtml(item.text || '')}</span>`).join('')}
                    </div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Live activities</div>
                    <div class="lms-call-activity-list">${activityCards}</div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Class materials</div>
                    <div class="lms-call-material-list">${(session.materials || []).map(material => `
                        <button type="button" class="lms-call-material" data-lms-click="downloadLmsClassMaterial(${lmsInlineArg(session.id)}, ${lmsInlineArg(material.id || material.title || 'material')})">
                            <i class="fas ${material.type === 'slides' ? 'fa-file-powerpoint' : 'fa-file-arrow-down'}"></i>
                            <span>${escapeHtml(material.title || 'Class material')}</span>
                            <em>${material.downloadable !== false ? 'Download' : 'View'}</em>
                        </button>
                    `).join('')}</div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-call-collab-panel">
                    <div class="lms-route-field-label">Breakout rooms</div>
                    <div class="lms-call-breakout-list">${breakoutRoomsMarkup}</div>
                    ${canManage ? `
                        <div class="lms-call-question-form">
                            <input id="lms-call-broadcast-${token}" class="lms-route-input" type="text" placeholder="Broadcast message to rooms">
                            <button type="button" class="lux-secondary-btn" data-lms-click="broadcastLmsBreakoutMessage(${lmsInlineArg(session.id)})"><i class="fas fa-bullhorn"></i> Broadcast</button>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-call-roster">
                <div class="lms-route-field-label">Participants</div>
                <div class="lms-call-person-list">${participantMarkup}</div>
            </div>
            <div class="lms-route-actions">
                ${joinButton}
                ${startButton}
                ${endButton}
                <button class="lux-secondary-btn" data-lms-click="copyLmsClassCallInvite(${lmsInlineArg(session.id)})"><i class="fas fa-link"></i> Copy invite</button>
                ${canManage && session.status === 'ended' ? `<button class="lux-secondary-btn" data-lms-click="publishLmsClassRecording(${lmsInlineArg(session.id)})"><i class="fas fa-record-vinyl"></i> Publish recording</button>` : ''}
            </div>
        </article>
    `;
}

function renderLmsCallsSection(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('calls', contentArea);
    const resourceKey = resolveCanonicalLmsResourceKey(courseId);
    const parsed = parseLmsCourseKey(resourceKey);
    const sectionMeta = getLmsSectionMeta(parsed.sectionType || getCurrentLmsSectionType());
    const sessions = ensureLmsClassSessionsForKey(resourceKey)
        .sort((a, b) => {
            const order = { active: 0, scheduled: 1, ended: 2 };
            const statusDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
            if (statusDiff) return statusDiff;
            return String(b.startedAt || b.scheduledAt || b.endedAt || '').localeCompare(String(a.startedAt || a.scheduledAt || a.endedAt || ''));
        });
    const canManage = canManageLmsClassSection(sectionMeta.type);
    const studentCount = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId).length;
    const activeCount = sessions.filter(session => session.status === 'active').length;
    const scheduledCount = sessions.filter(session => session.status === 'scheduled').length;
    const endedCount = sessions.filter(session => session.status === 'ended').length;
    const creationPanel = canManage ? `
        <div class="lms-route-panel lms-route-panel-compact">
            <div class="lms-route-card-head lms-route-card-head-mb-16">
                <div>
                    <div class="lms-route-card-title"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> Create ${escapeHtml(sectionMeta.label)} Lesson</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">Start immediately or schedule a lesson for this ${escapeHtml(sectionMeta.label.toLowerCase())}. The roster stays shared with the group.</div>
                </div>
            </div>
            <div class="lms-route-field-grid">
                <label class="lms-route-field">
                    <span class="lms-route-field-label">Lesson title</span>
                    <input id="lms-call-title" class="lms-route-input" type="text" placeholder="${escapeHtml(sectionMeta.label)} online lesson">
                </label>
                <label class="lms-route-field">
                    <span class="lms-route-field-label">Schedule time</span>
                    <input id="lms-call-scheduled" class="lms-route-input" type="datetime-local">
                </label>
                <label class="lms-route-field">
                    <span class="lms-route-field-label">Max participants</span>
                    <input id="lms-call-max" class="lms-route-input" type="number" min="1" max="200" value="200">
                </label>
                <label class="lms-route-field">
                    <span class="lms-route-field-label">Teaching week</span>
                    <select id="lms-call-week" class="lms-route-select">
                        ${buildLmsWeekSelectOptions(resourceKey, '')}
                    </select>
                </label>
                <label class="lms-route-field">
                    <span class="lms-route-field-label">Class layout mode</span>
                    <select id="lms-call-mode" class="lms-route-select">
                        <option value="lecture">Lecture mode</option>
                        <option value="seminar">Seminar mode</option>
                        <option value="whiteboard">Whiteboard mode</option>
                        <option value="coding">Coding mode</option>
                        <option value="math">Math mode</option>
                        <option value="exam">Exam supervision</option>
                    </select>
                </label>
            </div>
            <div class="lms-route-actions lms-route-actions-mt-16">
                <button class="lux-primary-btn" data-lms-click="startLmsClassCall(${lmsInlineArg(resourceKey)})"><i class="fas fa-circle-play"></i> Start live lesson</button>
                <button class="lux-secondary-btn" data-lms-click="scheduleLmsClassCall(${lmsInlineArg(resourceKey)})"><i class="fas fa-calendar-plus"></i> Schedule lesson</button>
            </div>
        </div>
    ` : '';
    const sessionsMarkup = sessions.length
        ? sessions.map(session => buildLmsCallSessionCard(session, resourceKey, parsed)).join('')
        : renderLmsRouteEmptyState('No Class Calls Yet', `${sectionMeta.label} calls will appear here after an instructor schedules or starts one.`, 'fa-video');

    contentArea.innerHTML = `
        <div class="lms-route-stack lms-calls-page">
            <div class="lms-route-panel lms-route-panel-pad-16-20">
                <div class="lms-route-card-head">
                    <div class="lms-route-inline lms-route-inline-center lms-route-inline-gap-12">
                        <i class="fas fa-video lms-route-lead-icon"></i>
                        <div>
                            <div class="lms-route-card-title">${escapeHtml(sectionMeta.label)} Online Lessons</div>
                            <div class="lms-route-copy lms-route-copy-mt-4">Schedule, start, and manage class sessions</div>
                        </div>
                    </div>
                    <div class="lms-route-inline lms-route-inline-gap-8">
                        <span class="lms-route-pill"><i class="fas fa-circle"></i> ${activeCount} live</span>
                        <span class="lms-route-pill"><i class="fas fa-calendar"></i> ${scheduledCount} scheduled</span>
                        <span class="lms-route-pill"><i class="fas fa-users"></i> ${studentCount} roster</span>
                    </div>
                </div>
            </div>
            ${creationPanel}
            <div class="lms-route-panel">
                <div class="lms-route-card-head lms-route-card-head-mb-16">
                    <div>
                        <div class="lms-route-card-title"><i class="fas fa-list-check"></i> Lesson Sessions</div>
                        <div class="lms-route-copy lms-route-copy-mt-6">Live, scheduled, and ended lessons for ${escapeHtml(sectionMeta.label.toLowerCase())}.</div>
                    </div>
                    <span class="lms-route-pill">${endedCount} ended</span>
                </div>
                <div class="lms-route-stack lms-route-stack-gap-16">${sessionsMarkup}</div>
            </div>
        </div>
    `;
}

function createLmsClassSession(resourceKey, status) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const parsed = parseLmsCourseKey(canonicalKey);
    const sectionType = normalizeLmsSectionType(parsed.sectionType) || getCurrentLmsSectionType();
    const currentUser = getLmsCurrentUserForCalls();
    if (!canManageLmsClassSection(sectionType)) {
        alert('You do not have permission to manage this class type.');
        return null;
    }
    const titleInput = document.getElementById('lms-call-title');
    const scheduledInput = document.getElementById('lms-call-scheduled');
    const maxInput = document.getElementById('lms-call-max');
    const weekInput = document.getElementById('lms-call-week');
    const modeInput = document.getElementById('lms-call-mode');
    const now = new Date().toISOString();
    const session = normalizeLmsClassSession({
        id: `lms-call-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sectionType,
        title: titleInput?.value?.trim() || `${getLmsSectionMeta(sectionType).label} online lesson`,
        topic: titleInput?.value?.trim() || `${getLmsSectionMeta(sectionType).label} online lesson`,
        weekLabel: weekInput?.value || '',
        lessonMode: modeInput?.value || (sectionType === 'workshop' ? 'seminar' : 'lecture'),
        status,
        hostUserId: currentUser.id,
        hostRole: getLmsRoleLabel?.() || currentUser.role || getLmsSectionMeta(sectionType).ownerLabel,
        startedAt: status === 'active' ? now : null,
        scheduledAt: scheduledInput?.value ? new Date(scheduledInput.value).toISOString() : (status === 'scheduled' ? now : null),
        participantIds: status === 'active' ? [currentUser.id] : [],
        maxParticipants: maxInput?.value || 200,
        attendanceEvents: status === 'active' ? [{
            id: `att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            userId: currentUser.id,
            eventType: 'join',
            at: now
        }] : []
    }, canonicalKey);
    ensureLmsClassSessionsForKey(canonicalKey).unshift(session);
    saveState();
    renderLmsCallsSection(canonicalKey);
    return session;
}

function startLmsClassCall(courseId) {
    createLmsClassSession(courseId, 'active');
}

function scheduleLmsClassCall(courseId) {
    createLmsClassSession(courseId, 'scheduled');
}

function startLmsScheduledClassCall(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    if (!canManageLmsClassSection(found.session.sectionType)) {
        alert('You do not have permission to start this lesson.');
        return;
    }
    const currentUser = getLmsCurrentUserForCalls();
    found.session.status = 'active';
    found.session.startedAt = new Date().toISOString();
    found.session.endedAt = null;
    if (!found.session.participantIds.includes(currentUser.id)) found.session.participantIds.push(currentUser.id);
    getLmsCallUserState(found.session, currentUser.id);
    addLmsCallAttendanceEvent(found.session, 'join', currentUser.id);
    saveState();
    renderLmsCallsSection(found.resourceKey);
}

function joinLmsClassCall(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    if (found.session.status !== 'active') {
        alert('This lesson is not live yet.');
        return;
    }
    if (found.session.roomSettings?.locked) {
        alert('This classroom is locked by the host.');
        return;
    }
    const currentUser = getLmsCurrentUserForCalls();
    if (found.session.participantIds.length >= found.session.maxParticipants && !found.session.participantIds.includes(currentUser.id)) {
        alert('This class call is full.');
        return;
    }
    if (!found.session.participantIds.includes(currentUser.id)) found.session.participantIds.push(currentUser.id);
    getLmsCallUserState(found.session, currentUser.id);
    addLmsCallAttendanceEvent(found.session, 'join', currentUser.id);
    saveState();
    renderLmsCallsSection(found.resourceKey);
}

function leaveLmsClassCall(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    const currentUser = getLmsCurrentUserForCalls();
    found.session.participantIds = found.session.participantIds.filter(id => String(id) !== currentUser.id);
    addLmsCallAttendanceEvent(found.session, 'leave', currentUser.id);
    stopLmsMediaStream(lmsClassLocalMediaRuntime.cameraStream);
    stopLmsMediaStream(lmsClassLocalMediaRuntime.screenStream);
    lmsClassLocalMediaRuntime.cameraStream = null;
    lmsClassLocalMediaRuntime.screenStream = null;
    saveState();
    renderLmsCallsSection(found.resourceKey);
}

function endLmsClassCall(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    if (!canManageLmsClassSection(found.session.sectionType)) {
        alert('You do not have permission to end this lesson.');
        return;
    }
    found.session.status = 'ended';
    found.session.endedAt = new Date().toISOString();
    stopLmsMediaStream(lmsClassLocalMediaRuntime.cameraStream);
    stopLmsMediaStream(lmsClassLocalMediaRuntime.screenStream);
    lmsClassLocalMediaRuntime.cameraStream = null;
    lmsClassLocalMediaRuntime.screenStream = null;
    found.session.studyPackage = {
        summary: `${found.session.title} ended with ${found.session.participantIds.length} participant${found.session.participantIds.length === 1 ? '' : 's'}.`,
        recordingStatus: found.session.roomSettings?.recording ? 'Processing recording' : 'Recording was not active'
    };
    if (found.session.roomSettings?.recording) {
        found.session.recordingUrl = `${window.location.origin}${window.location.pathname}?recording=${encodeURIComponent(found.session.id)}`;
    }
    saveState();
    renderLmsCallsSection(found.resourceKey);
}

function publishLmsClassRecording(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    if (!canManageLmsClassSection(found.session.sectionType)) {
        alert('You do not have permission to publish this recording.');
        return;
    }
    if (!found.session.studyPackage || typeof found.session.studyPackage !== 'object') found.session.studyPackage = {};
    found.session.recordingUrl = found.session.recordingUrl || `${window.location.origin}${window.location.pathname}?recording=${encodeURIComponent(found.session.id)}`;
    found.session.studyPackage.recordingStatus = 'Published recording';
    found.session.studyPackage.publishedAt = new Date().toISOString();
    found.session.studyPackage.publishedBy = getSimulatedUserName();
    saveState();
    renderLmsCallsSection(found.resourceKey);
}

function copyLmsClassCallInvite(sessionId) {
    const found = findLmsClassSession(sessionId);
    if (!found) return;
    const invite = `${window.location.origin}${window.location.pathname}?lmsCall=${encodeURIComponent(found.session.id)}`;
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(invite).then(() => alert('Class invite copied.'));
    } else {
        prompt('Copy class invite', invite);
    }
}
if (typeof window !== 'undefined') {
    window.ensureLmsClassSessionsForKey = window.ensureLmsClassSessionsForKey || ensureLmsClassSessionsForKey;
    window.renderLmsCallsSection = window.renderLmsCallsSection || renderLmsCallsSection;
}
