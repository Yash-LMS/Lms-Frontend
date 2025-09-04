export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const CLIENT_VERSION = import.meta.env.VITE_APP_VERSION;


export const USER_ACCOUNT_OTP_GENERATE = `${API_BASE_URL}/user/account/generateOtp`;
export const USER_ACCOUNT_OTP_VALIDATE = `${API_BASE_URL}/user/account/validateOtp`;

//Certificate
export const VERIFY_USER_CERTIFICATE = `${API_BASE_URL}/certificate/verify`;


//Instructor
export const OFFICE_LIST_URL = `${API_BASE_URL}/office/findOfficeList`;
export const REGISTER_USER_URL = `${API_BASE_URL}/user/register`;
export const LOGIN_URL = `${API_BASE_URL}/user/login`;
export const ADD_NEW_COURSE_URL = `${API_BASE_URL}/course/addNewCourse`;
export const ADD_NEW_SECTION_URL = `${API_BASE_URL}/course/addNewSection`;
export const VIEW_COURSE_URL = `${API_BASE_URL}/course/viewCourse`;
export const EDIT_COURSE_URL = `${API_BASE_URL}/course/editCourseDetail`;
export const VIEW_COURSE_DETAILS_URL = `${API_BASE_URL}/course/viewCourse/details`;
export const DELETE_FILE_URL = `${API_BASE_URL}/course/topic/file/delete`;
export const UPDATE_TOPIC_FILE_URL = `${API_BASE_URL}/course/updateTopicFile`;
export const EDIT_SECTION_URL = `${API_BASE_URL}/course/editSectionDetail`;
export const VIDEO_WATCH_URL = `${API_BASE_URL}/file/video/watch`;
export const ADD_TOPIC_URL = `${API_BASE_URL}/course/topic/add`;
export const DELETE_TOPIC_URL = `${API_BASE_URL}/course/topic/delete`;
export const DELETE_SECTION_URL = `${API_BASE_URL}/course/section/delete`;
export const FILE_PREVIEW_URL = `${API_BASE_URL}/file/view`;
export const COURSE_IMAGE_VIEW_URL = `${API_BASE_URL}/course/image`;
export const TEST_INSTRUCTOR_URL = `${API_BASE_URL}/test/findTests`;
export const TRAINEE_RESULT_BY_INSTRUCTOR = `${API_BASE_URL}/test/viewTraineeResults`;
export const UPDATE_SECTION_SEQUENCE = `${API_BASE_URL}/course/update/section/sequence`;
export const UPDATE_TOPIC_SEQUENCE = `${API_BASE_URL}/course/update/topic/sequence`;
export const INSTRUCTOR_TRAINEE_RESULT_URL = `${API_BASE_URL}/test/viewTraineeResults`;
export const FIND_DETAILED_TRAINEE_RESULT_URL = `${API_BASE_URL}/test/detail/result`;
export const CREATE_BATCH_URL = `${API_BASE_URL}/batch/create`;
export const VIEW_BATCH_URL = `${API_BASE_URL}/batch/viewBatch`;
export const ADD_COURSE_TO_BATCH_URL = `${API_BASE_URL}/batch/addCourse`;
export const ADD_TEST_TO_BATCH_URL = `${API_BASE_URL}/batch/addTest`;
export const ADD_CANDIDATE_TO_BATCH_URL = `${API_BASE_URL}/batch/addCandidate`;
export const FIND_COURSE_FOR_BATCH_URL = `${API_BASE_URL}/batch/findCourseAllotment`;
export const VERIFY_CANDIDATE_TO_BATCH_URL = `${API_BASE_URL}/batch/verifyEmployeeStatus`;
export const FIND_TEST_FOR_BATCH_URL = `${API_BASE_URL}/batch/findTests`;
export const FIND_EMPLOYEE_LIST_FOR_BATCH_URL = `${API_BASE_URL}/batch/findEmployeeList`;
export const FIND_CANDIDATE_LIST_FOR_BATCH_URL = `${API_BASE_URL}/batch/candidate/view`;
export const CREATE_ASSIGNMENT_URL = `${API_BASE_URL}/assignment/create`;
export const CREATE_CODING_ASSIGNMENT_URL = `${API_BASE_URL}/assignment/code/create`;

export const GET_ALL_CODING_TASK = `${API_BASE_URL}/assignment/getAllTask`;



export const VIEW_ASSIGNMENT_URL = `${API_BASE_URL}/assignment/user/viewAssignmentListByUser`;
export const ASSIGNMENT_SUBMISSION_FEEDBACK_URL = `${API_BASE_URL}/assignment/instructor/evaluate/assignment`;
export const VIEW_ASSIGNMENT_SUBMISSION_URL = `${API_BASE_URL}/assignment/instructor/submissionList`;
export const RESEND_COURSE_APPROVAL = `${API_BASE_URL}/course/approval/resend`;
export const RESEND_Test_APPROVAL = `${API_BASE_URL}/test/approval/resend`;
export const CREATE_FEEDBACK_URL = `${API_BASE_URL}/feedback/create`;
export const VIEW_FEEDBACK_URL = `${API_BASE_URL}/feedback/view`;
export const VIEW_FEEDBACK_FOR_ALLOTMENT_URL = `${API_BASE_URL}/feedback/allotment/viewFeedback`;

export const RELEASE_CANDIDATE_URL = `${API_BASE_URL}/batch/candidate/release`;
export const VIEW_BATCH_TEST_URL = `${API_BASE_URL}/batch/viewBatchTest`;
export const VIEW_BATCH_COURSE_URL = `${API_BASE_URL}/batch/viewBatchCourse`;
export const DELETE_BATCH_TEST_URL = `${API_BASE_URL}/batch/test/deleteTest`;

//Intern
export const REGISTER_INTERN_URL = `${API_BASE_URL}/user/intern/register`;

export const BULK_REGISTER_INTERN_URL = `${API_BASE_URL}/manager/register/internList`;
export const FIND_INTERN_LIST_URL = `${API_BASE_URL}/manager/findInternList`;
export const FIND_INTERN_IMAGE_URL = `${API_BASE_URL}/manager/intern/image`;
export const UPDATE_INTERN_STATUS_URL = `${API_BASE_URL}/manager/update/internStatus`;
export const UPDATE_COMPLETION_STATUS_URL = `${API_BASE_URL}/manager/update/intern/completionStatus`;
export const INTERNSHIP_PROGRAM_LIST = `${API_BASE_URL}/office/internship/findAllPrograms`;
export const UPDATE_INTERN_FEEDBACK_URL = `${API_BASE_URL}/manager/update/internFeedback`;

export const VERSION_CHECK_URL = `${API_BASE_URL}/version/check`;

//Technical Manager
export const FIND_COURSE_BY_STATUS_URL = `${API_BASE_URL}/manager/findCourseByStatus`;
export const FIND_DASHBOARD_INFORMATION_URL = `${API_BASE_URL}/manager/findDashboardInformation`;
export const FIND_TEST_BY_STATUS_URL = `${API_BASE_URL}/manager/findTestByStatus`;
export const APPROVE_COURSE_URL = `${API_BASE_URL}/manager/updateCourseStatus/approve`;
export const REJECT_COURSE_URL = `${API_BASE_URL}/manager/updateCourseStatus/reject`;
export const ALLOT_COURSE_URL = `${API_BASE_URL}/manager/allotCourseToTrainee`;
export const ALLOT_TEST_URL = `${API_BASE_URL}/manager/allotTestToTrainee`;
export const APPROVE_TEST_URL = `${API_BASE_URL}/manager/updateTestStatus/approve`;
export const REJECT_TEST_URL = `${API_BASE_URL}/manager/updateTestStatus/reject`;
export const FIND_TRAINEE_URL = `${API_BASE_URL}/manager/viewTraineeList`;
export const FIND_COURSE_URL = `${API_BASE_URL}/manager/findCourseAllotment`;
export const FIND_TEST_URL = `${API_BASE_URL}/manager/findTests`;
export const FIND_BATCH_URL = `${API_BASE_URL}/manager/findBatch`;
export const UPDATE_USER_ROLE_AND_STATUS_URL = `${API_BASE_URL}/manager/updateUserRoleAndStatus`;
export const FIND_EMPLOYEE_LIST_URL = `${API_BASE_URL}/manager/findEmployeeList`;
export const FIND_EMPLOYEE_INFO_URL = `${API_BASE_URL}/manager/findEmployeeInformation`;
export const ALL_TRAINEE_RESULT = `${API_BASE_URL}/manager/viewTraineeResults`;
export const VIEW_TRAINEE_RESULT = `${API_BASE_URL}/manager/viewTraineeResultsByTrainee`;
export const VIEW_TRAINEE_LIST = `${API_BASE_URL}/manager/view/allTrainees`;
export const VIEW_TRAINEE_ALLOTED_COURSE_URL = `${API_BASE_URL}/manager/viewTraineeAllotedCourse`;
export const VIEW_TRAINEE_ALLOTED_TEST_URL = `${API_BASE_URL}/manager/viewTraineeAllotedTest`;
export const REQUEST_BADGE_URL = `${API_BASE_URL}/manager/findSideBarBadgeInformation`;
export const ALL_USER_TRACKING_DETAIL_URL = `${API_BASE_URL}/manager/tracking/findTraineeCourse`;
export const USER_TRACKING_DETAIL_URL = `${API_BASE_URL}/manager/traineeCourseTracking`;
export const ADD_OFFICE_URL = `${API_BASE_URL}/manager/addOffice`;
export const CREATE_QUESTION_CATEGORY_URL = `${API_BASE_URL}/manager/createCategory`;
export const FIND_TRAINEE_RESULT_URL = `${API_BASE_URL}/manager/test/detail/result`;
export const EXTEND_TEST_END_DATE_URL = `${API_BASE_URL}/manager/test/extendDueDate`;
export const RESET_TEST_URL = `${API_BASE_URL}/manager/test/reset`;
export const DELETE_TEST_ALLOTMENT_URL = `${API_BASE_URL}/manager/test/allotment/delete`;

export const INTERN_FEEDBACK_VIEW_URL = `${API_BASE_URL}/manager/view/internFeedback`;

export const CREATE_ASSIGNMENT_CATEGORY_URL = `${API_BASE_URL}/manager/assignment/createCategory`;

export const SHOW_RESULT_PERMISSION_URL = `${API_BASE_URL}/manager/test/permission/showResult`;
export const SHOW_DETAIL_RESULT_PERMISSION_URL = `${API_BASE_URL}/manager/test/permission/showDetailResult`;
export const COURSE_COUNT_URL = `${API_BASE_URL}/manager/totalCourses`;
export const TEST_COUNT_URL = `${API_BASE_URL}/manager/totalTests`;
export const EMPLOYEE_COUNT_URL = `${API_BASE_URL}/manager/totalEmployees`;
export const INTERN_COUNT_URL = `${API_BASE_URL}/manager/totalInterns`;
export const FETCH_CATEGORIES_URL = `${API_BASE_URL}/manager/getCategories`;
export const UPDATE_CATEGORY_URL = `${API_BASE_URL}/manager/updateCategory`;
export const FETCH_ASSIGNMENT_CATEGORIES_URL = `${API_BASE_URL}/manager/assignment/getCategories`;
export const FIND_BATCHES_URL = `${API_BASE_URL}/manager/batch/viewBatchByStatus`;
export const APPROVE_BATCH_URL = `${API_BASE_URL}/manager/updateBatchStatus/approve`;
export const REJECT_BATCH_URL = `${API_BASE_URL}/manager/updateBatchStatus/reject`;

export const FIND_ASSIGNMENT_URL = `${API_BASE_URL}/manager/findAssignmentByStatus`;
export const APPROVE_ASSIGNMENT_URL = `${API_BASE_URL}/manager/updateAssignmentStatus/approve`;
export const REJECT_ASSIGNMENT_URL = `${API_BASE_URL}/manager/updateAssignmentStatus/reject`;

export const FIND_CANDIDATE_URL = `${API_BASE_URL}/manager/trp/findCandidates`;
export const GENERATE_TRP_URL = `${API_BASE_URL}/manager/trp/generate`;
export const GENERATE_BATCH_TRP_URL = `${API_BASE_URL}/manager/trp/batch/generate`;

export const UPDATE_INTERN_BULK_FEEDBACK = `${API_BASE_URL}/manager/bulk/update/internRemarkAndFeedback`;
export const TEST_SS_VIEW = `${API_BASE_URL}/manager/test/invigilation/image`; 

export const UPDATE_USER_PASSWORD = `${API_BASE_URL}/manager/user/updatePassword`; 

export const VIEW_TRAINEE_ASSIGNMENT_URL = `${API_BASE_URL}/assignment/allotment/viewAssignmentList`;
export const ALLOT_ASSIGNMENT_URL = `${API_BASE_URL}/manager/allotAssignmentToTrainee`;

export const DOWNLOAD_ASSIGNMENT_FILES = `${API_BASE_URL}/assignment/file/download`;

export const ALLOT_ASSIGNMENT_BATCH_URL = `${API_BASE_URL}/batch/addAssignmentToBatch`;
export const EMPLOYEE_PROFILE_IMAGE_URL = `${API_BASE_URL}/manager/employee/image`;
export const DOWNLOAD_RESUME_URL = `${API_BASE_URL}/manager/document/resume/download`;

export const RELEASE_TRAINEE_FROM_COURSE_URL = `${API_BASE_URL}/manager/course/releaseTrainee`;

export const VIEW_CODING_TASK_URL = `${API_BASE_URL}/manager/coding/taskView`;
export const ALLOT_CODING_TASK_URL = `${API_BASE_URL}/manager/coding/allotTestToTrainee`;

//User
export const VIEW_ALLOTED_COURSE_URL = `${API_BASE_URL}/user/viewAllotedCourse`;
export const VIEW_ALLOTED_TEST_URL = `${API_BASE_URL}/user/viewAllotedTest`;
export const VIEW_USER_COURSE_DETAIL_URL = `${API_BASE_URL}/user/viewCourse/details`;
export const USER_VIDEO_WATCH_URL = `${API_BASE_URL}/user/file/video/watch`;
export const USER_FILE_PREVIEW_URL = `${API_BASE_URL}/user/file/view`;
export const USER_FEEDBACK_URL = `${API_BASE_URL}/user/course/feedback`;
export const VIEW_USER_TEST_URL = `${API_BASE_URL}/user/test/view`;

export const START_TEST_URL = `${API_BASE_URL}/user/test/start/view`;
export const SUBMIT_TEST_URL = `${API_BASE_URL}/user/test/submit`;
export const RESULT_TEST_URL = `${API_BASE_URL}/user/test/result`;
export const DETAIL_RESULT_TEST_URL = `${API_BASE_URL}/user/test/detail/result`;

export const USER_COURSE_FEEDBACK_URL = `${API_BASE_URL}/user/course/submitFeedback`;
export const USER_COURSE_CERTIFICATE_URL = `${API_BASE_URL}/user/course/request/certificate`;
export const VIEW_VIDEO_UPDATE_STATUS_URL = `${API_BASE_URL}/user/file/video/view/updateStatus`;
export const COMPLETE_VIDEO_UPDATE_STATUS_URL = `${API_BASE_URL}/user/file/video/complete/updateStatus`;
export const DOC_UPDATE_STATUS_URL = `${API_BASE_URL}/user/file/doc/updateStatus`;
export const VIDEO_SIZE_URL = `${API_BASE_URL}/user/file/video/size`; // in minutes

export const TEST_SS_CAPTURE = `${API_BASE_URL}/user/test/capture`; 
export const UPDATE_PASSWORD = `${API_BASE_URL}/user/updatePassword`; 

export const SUBMIT_ASSIGNMENT_URL = `${API_BASE_URL}/user/assignment/submit`; 
export const SUBMIT_INTERNAL_ASSIGNMENT_URL = `${API_BASE_URL}/user/internal/assignment/submit`; 
export const VIEW_ASSIGNMENT_TRAINEE_URL = `${API_BASE_URL}/user/assignment/view`;
export const VIEW_INTERNAL_ASSIGNMENT_ALLOTMENT_URL = `${API_BASE_URL}/user/assignment/view/allotmentId`;

export const ASSIGNMENT_UPDATE_STATUS_VIEW_URL = `${API_BASE_URL}/user/file/assignment/view/updateStatus`;

export const USER_COURSE_VERIFY_MANUALLY_URL = `${API_BASE_URL}/user/course/verifyCompletionStatus`;
export const USER_FEEDBACK_QUESTIONS_VIEW_URL = `${API_BASE_URL}/user/feedback/viewFeedback`;
export const USER_FEEDBACK_QUESTIONS_SUBMIT_URL = `${API_BASE_URL}/user/feedback/submit`;

export const PROFILE_UPDATE_URL = `${API_BASE_URL}/user/employee/documentUpdate`;
export const EMPLOYEE_UPDATE_URL = `${API_BASE_URL}/user/employee/update/employeeId`;

export const DOWNLOAD_YOUR_RESUME_URL = `${API_BASE_URL}/user/document/resume/download`
export const UPDATE_RESUME_URL = `${API_BASE_URL}/user/document/resume/update`;
export const USER_PROFILE_IMAGE_URL = `${API_BASE_URL}/user/employee/image`;

export const VIEW_CODING_TASK = `${API_BASE_URL}/user/coding/viewCodingList`;


export const VIEW_ALLOTED_CODING_TASK = `${API_BASE_URL}/user/coding/viewAllotedTask`;
export const SUBMIT_CODING_TASK = `${API_BASE_URL}/user/coding/submit`;


//Test
export const CREATE_TEST_URL = `${API_BASE_URL}/test/createTest`;
export const VIEW_TEST_URL = `${API_BASE_URL}/test/instructor/view/test`;
export const ADD_QUESTION_URL = `${API_BASE_URL}/test/addQuestions`;
export const PREVIEW_TEST_URL = `${API_BASE_URL}/test/view/question`;
export const PREVIEW_TEST_MANAGER_URL = `${API_BASE_URL}/manager/view/question`;
export const FIND_QUESTION_BY_USER_URL = `${API_BASE_URL}/library/findQuestionByUser`;
export const UPDATE_QUESTION_URL = `${API_BASE_URL}/library/updateQuestion`;
export const UPDATE_TEST_QUESTION_URL= `${API_BASE_URL}/test/update/question`;
export const DELETE_TEST_URL = `${API_BASE_URL}/manager/test/delete`;


// Analysis
export const COURSE_ANALYSIS_URL = `${API_BASE_URL}/analysis/course`;
export const TEST_ANALYSIS_URL = `${API_BASE_URL}/analysis/test`;

export const COURSE_CTR_DOWNLOAD = `${API_BASE_URL}/course/remainder/day`;



// Question Library
export const VIEW_QUESTION_ALL_CATEGORY_URL = `${API_BASE_URL}/library/find/all/question/category`;
export const VIEW_QUESTION_ALL_SUB_CATEGORY_URL = `${API_BASE_URL}/library/find/all/question/subcategory`;

export const VIEW_QUESTION_DISTINCT_CATEGORY_URL = `${API_BASE_URL}/library/find/distinct/question/category`;
export const VIEW_QUESTION_DISTINCT_SUB_CATEGORY_URL = `${API_BASE_URL}/library/find/distinct/question/subcategory`;

export const ADD_QUESTION_Library_URL = `${API_BASE_URL}/library/addQuestion`;
export const VIEW_RANDOM_QUESTION_Library_URL = `${API_BASE_URL}/library/random/findQuestion`;
export const VIEW_QUESTION_BY_CATEGORY_Library_URL = `${API_BASE_URL}/library/category/findQuestion`;

// All Access

export const DOWNLOAD_ASSIGNMENT_INSTRUCTION_FILE = `${API_BASE_URL}/assignment/file/instruction/download/assignmentId`;
export const DOWNLOAD_ASSIGNMENT_INSTRUCTION_ALLOTMENTID_FILE = `${API_BASE_URL}/assignment/file/instruction/download/allotmentId`;

export const FIND_ASSIGNMENT_CATEGORY = `${API_BASE_URL}/assignment/general/assignment/categories`;
export const FIND_ASSIGNMENT_SUBCATEGORY = `${API_BASE_URL}/assignment/general/assignment/subcategories`;