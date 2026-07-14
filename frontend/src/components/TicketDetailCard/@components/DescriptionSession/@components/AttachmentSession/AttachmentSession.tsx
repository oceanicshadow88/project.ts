import React from 'react';
import styles from './AttachmentSession.module.scss';

interface IAttachmentSession {
  attachmentUrls: string[];
}

export default function AttachmentSession({ attachmentUrls }: IAttachmentSession) {
  const hasAttachments = attachmentUrls && attachmentUrls.length > 0;

  return (
    <div className={styles.attachmentsContainer}>
      <h4>Attachments</h4>
      {hasAttachments ? (
        <div className={styles.attachmentsList}>
          {attachmentUrls.map((url) => (
            <div key={url} className={styles.attachmentItem}>
              <img src={url} alt="attachment" />
              <div className={styles.attachmentOverlay}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>No attachments</div>
      )}
    </div>
  );
}
