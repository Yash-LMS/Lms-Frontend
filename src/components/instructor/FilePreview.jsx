import React, { useEffect, useState } from "react";
import axios from "axios";
import { FILE_PREVIEW_URL } from "../../constants/apiConstants";
import styles from "./FilePreview.module.css"; 

const FilePreview = ({ topicId, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState(null);

    const fetchFile = async () => {
        try {
            const response = await axios.get(`${FILE_PREVIEW_URL}`, {
                params: { topicId },
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            setPdfUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error("Error fetching file:", error);
            alert("Failed to load file");
        }
    };

    useEffect(() => {
        fetchFile();
    }, [topicId]);

    const openPdfInNewTab = () => {
        if (pdfUrl) {
            window.open(pdfUrl, "_blank");
        }
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <header className={styles.modalHeader}>
                    <h2>PDF File Preview</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        &times;
                    </button>
                </header>
                <div className={styles.modalBody}>
                    {pdfUrl && (
                        <div className={styles.previewContainer}>
                            <iframe
                                src={pdfUrl}
                                className={styles.previewFrame}
                                title="PDF Preview"
                            ></iframe>
                            <button onClick={openPdfInNewTab} className={styles.openTabButton}>
                                Open in New Tab
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreview;