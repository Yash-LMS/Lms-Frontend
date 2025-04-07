export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const USER_ACCOUNT_OTP_GENERATE = `${API_BASE_URL}/user/account/generateOtp`;
export const USER_ACCOUNT_OTP_VALIDATE = `${API_BASE_URL}/user/account/validateOtp`;

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
export const UPDATE_SECTION_SEQUENCE = `${API_BASE_URL}/course/update/section/sequence`;

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
