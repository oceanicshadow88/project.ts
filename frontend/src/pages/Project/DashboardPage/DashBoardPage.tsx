/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { v4 as uuidv4 } from 'uuid';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loading from '../../../components/Loading/Loading';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import ValueCard from './components/ValueCard/ValueCard';
import useFetchDashboardData from './hooks/useFetchDashboardData';
import ChartCard, { ChartType } from './components/ChartCard/ChartCard';
import {
  getEpicStatusSummary,
  getPDFReportContent,
  getSummary
} from '../../../api/dashboard/dashboard';
import { IMinEvent } from '../../../types';
import { getSprintById } from '../../../utils/sprintUtils';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';

interface IValueCard {
  title: string;
  value: number | string;
}

interface ILineChartData {
  data: ReadonlyArray<object>;
  dataKeyList: string[];
}

interface IBarChartData {
  dataKeyList: string[];
  data: { name: string; count: number }[];
}
type SummaryItem = {
  name: string;
  total: number;
};

interface IEpicChartItem {
  name: string;
  [status: string]: number | string;
}

function DashBoardPage() {
  const { data, isLoading } = useFetchDashboardData();
  const { projectId } = useParams();
  const [PDFcontent, setPDFcontent] = useState<string>('');
  const [isPDFLoading, setIsPDFLoading] = useState<boolean>(false);
  const [isShowPDF, setIsShowPDF] = useState<boolean>(false);
  const [chartBase64String, setChartBase64String] = useState<string>('');
  const [dailyReport, setDailyReport] = useState<any>([]);
  const [selectedSprint, setSelectedSprint] = useState<any>('');
  const projectDetails = useContext(ProjectDetailsContext);

  const [statusPieChartData, setStatusPieChartData] = useState<{ name: string; value: number }[]>(
    []
  );
  const [typesBarChartData, setTypesBarChartData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const loadStatusSummary = async () => {
      if (!projectId) return;
      const res = await getSummary(projectId, 'status');
      setStatusPieChartData(
        res?.data?.map((item: SummaryItem) => ({
          name: item.name.toUpperCase(),
          value: item.total
        }))
      );
    };
    loadStatusSummary();
  }, [projectId]);

  useEffect(() => {
    const loadTypeSummary = async () => {
      if (!projectId) return;
      const res = await getSummary(projectId, 'type');
      setTypesBarChartData(
        res?.data?.map((item: SummaryItem) => ({
          name: item.name.toUpperCase().replace(/\s+/g, ''),
          value: item.total
        }))
      );
    };
    loadTypeSummary();
  }, [projectId]);

  const [epicChartData, setEpicChartData] = useState<IEpicChartItem[]>([]);
  const [epicStatusKeys, setEpicStatusKeys] = useState<string[]>([]);

  const calculateEpicTotal = (epic: IEpicChartItem): number => {
    return Object.keys(epic).reduce((sum, key) => {
      if (key !== 'name' && typeof epic[key] === 'number') {
        return sum + (epic[key] as number);
      }
      return sum;
    }, 0);
  };

  useEffect(() => {
    const fetchEpicSummary = async () => {
      if (!projectId) return;
      const result = await getEpicStatusSummary(projectId);

      const formatted = result.map(({ epicTitle, statusSummary }) => {
        const obj: IEpicChartItem = { name: epicTitle };

        statusSummary.map((s) => {
          obj[s.status] = +s.count;
          return s;
        });

        return obj;
      });

      const statusSet = new Set<string>();
      result.map((epic) => {
        return epic.statusSummary.map((statusItem) => statusSet.add(statusItem.status));
      });

      // Sort epics by total count in descending order
      const sortedFormatted = formatted.sort((a, b) => {
        const totalA = calculateEpicTotal(a);
        const totalB = calculateEpicTotal(b);
        return totalB - totalA; // Descending order
      });

      setEpicChartData(sortedFormatted);
      setEpicStatusKeys(Array.from(statusSet));
    };

    fetchEpicSummary();
  }, [projectId]);

  const valueCardList: IValueCard[] = useMemo(() => {
    if (!data) return [];

    const { ticketCount, dailyScrumCount } = data;
    const { total: totalTicket, toDo, inProgress, done, review } = ticketCount;

    const valueCardListData: IValueCard[] = [
      {
        title: 'fo time',
        value: totalTicket
      },
      {
        title: 'supp',
        value: dailyScrumCount?.isNeedSupport?.total
      },
      {
        title: 'WTF',
        value: toDo
      },
      {
        title: 'New',
        // To do stands for 0%, in progress stands for 70%, preview stands for 80%, done stands for 100%
        // avoid using toFixed() to keep the type of number
        value: `${(
          ((toDo * 0 + inProgress * 0.7 + review * 0.8 + done * 1) / totalTicket) *
          100
        ).toFixed(1)}%`
      }
    ];

    return valueCardListData;
  }, [data]);

  const barChartData = useMemo((): IBarChartData => {
    if (!data) return { data: [], dataKeyList: [] };
    const { ticketCount } = data;
    const modifiedData = Object.entries(ticketCount).filter(([key]) => key !== 'total');

    return {
      dataKeyList: modifiedData.map(([key]) => key),
      data: modifiedData.map(([key, value]) => ({
        name: key?.toUpperCase(),
        count: value
      }))
    };
  }, [data]);

  const generatePDFPreview = async () => {
    try {
      setIsPDFLoading(true);
      const res = await getPDFReportContent(projectId as string);
      setIsPDFLoading(false);
      setIsShowPDF(true);
      setPDFcontent(res?.content);
    } catch (error) {
      toast('Something went wrong when generating PDF!', {
        theme: 'colored',
        toastId: 'PDF error'
      });
      setIsShowPDF(false);
      setIsPDFLoading(false);
    }
  };

  const closePDFPreview = () => {
    setIsShowPDF(false);
    setChartBase64String('');
  };

  const onChangeSprint = (e: IMinEvent) => {
    setSelectedSprint(getSprintById(e.target.value as string, projectDetails));
  };

  const sprintsOptions = projectDetails.sprints
    .filter((item) => item.status === 'active')
    .map((item) => {
      return {
        label: item.name,
        value: item.id
      };
    });

  return (
    <ProjectHOC title="Dashboard">
      <div className="mb-6 ml-8 max-w-300">
        <Dropdown
          label="Sprint"
          dataTestId="Sprint"
          onValueChanged={onChangeSprint}
          onValueBlur={() => {}}
          value={selectedSprint.id}
          name="sprint"
          options={sprintsOptions}
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex-1 pl-5 overflow-x-hidden">
          {dailyReport.length > 0 && (
            <div className="rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-5 text-responsive-h2">Actions</h2>
              <div>
                {dailyReport.map((item) => (
                  <div
                    key={`action-${item?.toString().slice(0, 30).replaceAll(/\s+/g, '-')}`}
                    className="px-4 py-3 my-2 bg-primary-light border-l-4 border-primary rounded-r-md text-sm leading-relaxed first:mt-0 last:mb-0"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-5">
              <div className="flex-1">
                <h2 className="m-0 font-semibold text-responsive-h2">Sprint Overview</h2>
                <p className="mt-1 mb-0 text-sm italic text-secondary opacity-80">
                  Current sprint metrics and work item distribution
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                {isShowPDF ? (
                  <button type="button" className="pdf-btn-close" onClick={closePDFPreview}>
                    Close Preview
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pdf-btn-export bg-primary"
                    onClick={generatePDFPreview}
                  >
                    Preview PDF
                  </button>
                )}
              </div>
            </div>
            {isPDFLoading ? <Loading /> : null}
            <div className="dashboard-grid-layout">
              <div className="value-cards-column">
                {valueCardList.map(({ title, value }, index) => (
                  <div key={uuidv4()} className="flex-1">
                    <ValueCard title={title} value={value} />
                  </div>
                ))}
              </div>
              <div className="chart-container">
                <ChartCard
                  type={ChartType.PIE_CHART}
                  data={statusPieChartData}
                  setChartBase64String={() => {}}
                />
              </div>
              <div className="chart-container">
                <ChartCard
                  type={ChartType.TYPE_BAR_CHART}
                  data={typesBarChartData}
                  setChartBase64String={() => {}}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-5">
              <div className="flex-1">
                <h2 className="m-0 font-semibold text-responsive-h2">Milestone Progress</h2>
                <p className="mt-1 mb-0 text-sm italic text-secondary opacity-80">
                  Track progress across all epics and long-term milestones
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="w-full">
                <ChartCard
                  data={epicChartData}
                  type={ChartType.EPIC_BAR_CHART}
                  dataKeyList={epicStatusKeys}
                  setChartBase64String={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </ProjectHOC>
  );
}

export default DashBoardPage;
