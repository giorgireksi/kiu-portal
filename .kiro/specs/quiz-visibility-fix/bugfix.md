# Bugfix Requirements Document

## Introduction

The student portal LMS quiz feature is completely broken due to a missing function `isLmsQuizVisibleToStudentsNow`. When students attempt to view quizzes, the application crashes with a ReferenceError, preventing access to the entire quiz workflow. This function is called in two critical locations:
- Line 6127: Filtering quizzes for student display in `renderStudentLmsQuizSection`
- Line 3445: Determining publication status during quiz publishing logic

The function must be implemented to determine whether a quiz should be visible to students based on publication status and scheduled availability windows.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a student navigates to the quiz section THEN the system crashes with "ReferenceError: isLmsQuizVisibleToStudentsNow is not defined"

1.2 WHEN the quiz rendering logic attempts to filter visible quizzes THEN the application fails at line 6127 during the filter operation

1.3 WHEN the quiz publishing logic executes with scheduled mode THEN the system crashes at line 3445 when determining publishedAt timestamp

1.4 WHEN the missing function is called with any quiz object THEN the JavaScript execution halts and prevents all subsequent quiz operations

### Expected Behavior (Correct)

2.1 WHEN a student navigates to the quiz section THEN the system SHALL successfully filter and display only visible quizzes without crashing

2.2 WHEN a quiz has isPublished=true and status='published' THEN the system SHALL return true indicating the quiz is visible

2.3 WHEN a quiz has scheduled availability with availableFrom in the past and availableUntil in the future (or null) THEN the system SHALL return true indicating the quiz is currently available

2.4 WHEN a quiz has scheduled availability with availableFrom in the future THEN the system SHALL return false indicating the quiz is not yet available

2.5 WHEN a quiz has scheduled availability with availableUntil in the past THEN the system SHALL return false indicating the quiz is no longer available

2.6 WHEN a quiz has isPublished=false or status='draft' THEN the system SHALL return false indicating the quiz is not visible to students

2.7 WHEN the quiz publishing logic executes with scheduled mode THEN the system SHALL successfully evaluate visibility and set the appropriate publishedAt timestamp

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the existing function `getLmsQuizAvailabilityState` is called THEN the system SHALL CONTINUE TO return the correct availability state ('draft', 'upcoming', 'open', 'closed', 'submitted', 'graded', 'in-progress')

3.2 WHEN the existing function `isStudentAllowedForLmsQuiz` is called THEN the system SHALL CONTINUE TO correctly determine student access permissions

3.3 WHEN quizzes are filtered for student display THEN the system SHALL CONTINUE TO apply both visibility and permission checks

3.4 WHEN quiz objects are accessed for their properties (availableFrom, availableUntil, isPublished, status, publishedAt, publishMode) THEN the system SHALL CONTINUE TO read these properties correctly

3.5 WHEN the quiz publishing workflow sets publishedAt based on scheduled vs manual mode THEN the system SHALL CONTINUE TO follow the existing logic pattern

3.6 WHEN the function `sortLmsQuizzes` is called on the filtered quiz array THEN the system SHALL CONTINUE TO sort quizzes correctly

3.7 WHEN quiz submission status is checked THEN the system SHALL CONTINUE TO correctly identify submitted, auto-submitted, and graded quizzes
