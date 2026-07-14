import React from 'react';
import { HealthData } from '../../../../../api/dashboard/dashboard';
import styles from './HealthStatus.module.scss';
import SectionTitle from '../../../../../components/SectionTitle/SectionTitle';

interface HealthStatusProps {
  healthData: HealthData;
}

type HealthStatusItem = {
  onTrack: boolean;
  atRisk: boolean;
};

function HealthStatus({ healthData }: HealthStatusProps) {
  const { sprintHealth, epicHealth } = healthData;

  const getStatusColor = (atRisk: boolean): string => {
    return atRisk ? '#fd7171' : '#6a2add'; // Red if at risk, theme color otherwise
  };

  const getStatusText = (onTrack: boolean, atRisk: boolean): string => {
    if (atRisk) return 'At Risk';
    if (onTrack) return 'On Track';
    return 'Needs Attention';
  };

  return (
    <div className={styles.healthStatusContainer}>
      {/* Sprint Health Section */}
      {Object.keys(sprintHealth).length > 0 && (
        <div className={styles.healthSection}>
          <SectionTitle>Sprint Health</SectionTitle>
          <div className={styles.healthItems}>
            {(Object.entries(sprintHealth) as Array<[string, HealthStatusItem]>).map(
              ([sprintName, health]) => {
                const color = getStatusColor(health.atRisk);
                return (
                  <div key={sprintName} className={styles.healthItem}>
                    <div className={styles.healthItemHeader}>
                      <span className={styles.itemName}>{sprintName}</span>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: color, color: '#fff' }}
                      >
                        {getStatusText(health.onTrack, health.atRisk)}
                      </span>
                    </div>
                    <div className={styles.healthIndicators}>
                      <div className={styles.indicator}>
                        <span
                          className={styles.indicatorDot}
                          style={{ backgroundColor: health.onTrack ? '#6a2add' : '#fd7171' }}
                        />
                        <span className={styles.indicatorText}>
                          {health.onTrack ? 'On Track' : 'Off Track'}
                        </span>
                      </div>
                      <div className={styles.indicator}>
                        <span
                          className={styles.indicatorDot}
                          style={{ backgroundColor: health.atRisk ? '#fd7171' : '#6a2add' }}
                        />
                        <span className={styles.indicatorText}>
                          {health.atRisk ? 'At Risk' : 'Safe'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Epic Health Section */}
      {Object.keys(epicHealth).length > 0 && (
        <div className={styles.healthSection}>
          <SectionTitle>Epic Health</SectionTitle>
          <div className={styles.healthItems}>
            {(Object.entries(epicHealth) as Array<[string, HealthStatusItem]>).map(
              ([milestoneName, health]) => {
                const color = getStatusColor(health.atRisk);
                return (
                  <div key={milestoneName} className={styles.healthItem}>
                    <div className={styles.healthItemHeader}>
                      <span className={styles.itemName}>{milestoneName}</span>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: color, color: '#fff' }}
                      >
                        {getStatusText(health.onTrack, health.atRisk)}
                      </span>
                    </div>
                    <div className={styles.healthIndicators}>
                      <div className={styles.indicator}>
                        <span
                          className={styles.indicatorDot}
                          style={{ backgroundColor: health.onTrack ? '#6a2add' : '#fd7171' }}
                        />
                        <span className={styles.indicatorText}>
                          {health.onTrack ? 'On Track' : 'Off Track'}
                        </span>
                      </div>
                      <div className={styles.indicator}>
                        <span
                          className={styles.indicatorDot}
                          style={{ backgroundColor: health.atRisk ? '#fd7171' : '#6a2add' }}
                        />
                        <span className={styles.indicatorText}>
                          {health.atRisk ? 'At Risk' : 'Safe'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthStatus;
