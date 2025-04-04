import React, { useEffect, useState } from "react";
import axios from "axios";
import { USER_FILE_PREVIEW_URL, DOC_UPDATE_STATUS_URL } from "../../constants/apiConstants";
import styles from "./CourseContent.module.css"; 

const FilePreview = ({ topicId, trackingId, completionStatus, user, token, courseId }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFile = async () => {
        try {
            setLoading(true);
            setError(null);
            
           
            const response = await axios.get(`${USER_FILE_PREVIEW_URL}`, {
                params: { 
                    topicId,
                },
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            setPdfUrl(URL.createObjectURL(blob));
            
            // Call updateStatus only if completionStatus is not "completed"
            if (completionStatus !== "completed") {
                await updateStatus();
            }
        } catch (error) {
            console.error("Error fetching file:", error);
            
            // Handle different error status codes
            if (error.response) {
                switch (error.response.status) {
                    case 401:
                        setError("Unauthorized: Your session has expired or you are not logged in. Please login again.");
                        break;
                    case 403:
                        setError("Forbidden: You don't have access to this course. Please enroll or contact support.");
                        break;
                    default:
                        setError("Failed to load file. Please try again later.");
                }
            } else {
                setError("Network error. Please check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async () => {
        setLoading(true);
        setError(null);
    
        try {
    
            const requestBody = {
                user,
                token,
                courseTrackingId: trackingId,
            };
    
            const response = await axios.post(`${DOC_UPDATE_STATUS_URL}`, requestBody);
    
            // Handle the response if needed
            console.log("Status updated successfully:", response.data);
        } catch (error) {
            console.error("Error updating status:", error);
    
            // Handle different error status codes
            if (error.response) {
                switch (error.response.status) {
                    case 401:
                        setError("Unauthorized: Your session has expired or you are not logged in. Please login again.");
                        break;
                    case 403:
                        setError("Forbidden: You don't have access to update the status. Please contact support.");
                        break;
                    default:
                        setError("Failed to update status. Please try again later.");
                }
            } else {
                setError("Network error. Please check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFile();
        // Clean up created object URL when component unmounts
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [topicId, user, token, courseId]);


    return (
        <div className={styles.cleanPdfContainer}>
            {loading ? (
                <div className={styles.pdfLoading}>Loading document...</div>
            ) : error ? (
                <div className={styles.pdfError}>{error}</div>
            ) : (
                <>
                    {pdfUrl && (
                        <>
                            <iframe
                                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                                className={styles.cleanPdfFrame}
                                title="PDF Preview"
                            ></iframe>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default FilePreview;