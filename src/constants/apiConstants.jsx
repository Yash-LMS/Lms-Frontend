export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
export const INSTRUCTOR_TRAINEE_RESULT_URL = `${API_BASE_URL}/test/viewTraineeResults`;
export const FIND_DETAILED_TRAINEE_RESULT_URL = `${API_BASE_URL}/test/detail/result`;

//Intern
export const REGISTER_INTERN_URL = `${API_BASE_URL}/user/intern/register`;

export const BULK_REGISTER_INTERN_URL = `${API_BASE_URL}/manager/register/internList`;
export const FIND_INTERN_LIST_URL = `${API_BASE_URL}/manager/findInternList`;
export const FIND_INTERN_IMAGE_URL = `${API_BASE_URL}/manager/intern/image`;
export const UPDATE_INTERN_STATUS_URL = `${API_BASE_URL}/manager/update/internStatus`;
export const UPDATE_COMPLETION_STATUS_URL = `${API_BASE_URL}/manager/update/intern/completionStatus`;
export const INTERNSHIP_PROGRAM_LIST = `${API_BASE_URL}/office/internship/findAllPrograms`;
export const UPDATE_INTERN_FEEDBACK_URL = `${API_BASE_URL}/manager/update/internFeedback`;

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

export const SHOW_RESULT_PERMISSION_URL = `${API_BASE_URL}/manager/test/permission/showResult`;
export const SHOW_DETAIL_RESULT_PERMISSION_URL = `${API_BASE_URL}/manager/test/permission/showDetailResult`;
export const COURSE_COUNT_URL = `${API_BASE_URL}/manager/totalCourses`;
export const TEST_COUNT_URL = `${API_BASE_URL}/manager/totalTests`;
export const EMPLOYEE_COUNT_URL = `${API_BASE_URL}/manager/totalEmployees`;
export const INTERN_COUNT_URL = `${API_BASE_URL}/manager/totalInterns`;
export const FETCH_CATEGORIES_URL = `${API_BASE_URL}/manager/getCategories`;
export const UPDATE_CATEGORY_URL = `${API_BASE_URL}/manager/updateCategory`;


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

//Test
export const CREATE_TEST_URL = `${API_BASE_URL}/test/createTest`;
export const VIEW_TEST_URL = `${API_BASE_URL}/test/instructor/view/test`;
export const ADD_QUESTION_URL = `${API_BASE_URL}/test/addQuestions`;
export const PREVIEW_TEST_URL = `${API_BASE_URL}/test/view/question`;
export const PREVIEW_TEST_MANAGER_URL = `${API_BASE_URL}/manager/view/question`;
export const FIND_QUESTION_BY_USER_URL = `${API_BASE_URL}/library/findQuestionByUser`;
export const UPDATE_QUESTION_URL = `${API_BASE_URL}/library/updateQuestion`;


// Question Library
export const VIEW_QUESTION_ALL_CATEGORY_URL = `${API_BASE_URL}/library/find/all/question/category`;
export const VIEW_QUESTION_ALL_SUB_CATEGORY_URL = `${API_BASE_URL}/library/find/all/question/subcategory`;

export const VIEW_QUESTION_DISTINCT_CATEGORY_URL = `${API_BASE_URL}/library/find/distinct/question/category`;
export const VIEW_QUESTION_DISTINCT_SUB_CATEGORY_URL = `${API_BASE_URL}/library/find/distinct/question/subcategory`;

export const ADD_QUESTION_Library_URL = `${API_BASE_URL}/library/addQuestion`;
export const VIEW_RANDOM_QUESTION_Library_URL = `${API_BASE_URL}/library/random/findQuestion`;
export const VIEW_QUESTION_BY_CATEGORY_Library_URL = `${API_BASE_URL}/library/category/findQuestion`;

