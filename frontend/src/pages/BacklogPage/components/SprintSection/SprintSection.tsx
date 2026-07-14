import React, { useContext } from 'react';
import { BiDotsHorizontal } from 'react-icons/bi';
import { BsArrowRight } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import IconButton from '../../../../components/Form/Button/IconButton/IconButton';
import CreateEditSprint from '../CreateEditSprint/CreateEditSprint';
import { updateSprint } from '../../../../api/sprint/sprint';
import { ProjectDetailsContext } from '../../../../context/ProjectDetailsProvider';
import { ISprint } from '../../../../types';
import { ModalContext } from '../../../../context/ModalProvider';
import checkAccess from '../../../../utils/helpers';
import { Permission } from '../../../../utils/permission';
import Dropdown from '../../../../lib/FormV3/Dropdown/Dropdown';

interface ISprintSection {
  sprint: ISprint;
  totalIssue: number;
  onSprintComplete: (sprintId: string) => Promise<boolean>;
  children?: React.ReactNode | string;
  dataTestId?: string;
}

export default function SprintSection({
  totalIssue,
  sprint,
  dataTestId,
  children,
  onSprintComplete
}: ISprintSection) {
  const { projectId = '' } = useParams();
  const projectDetails = useContext(ProjectDetailsContext);
  const { showModal, closeModal } = useContext(ModalContext);
  const dateWithDay = (date?: Date | null) => {
    if (!date) {
      return '';
    }
    const fullDate = date.toString().split('T')[0];
    const dateDataArray = fullDate.split('-');
    return `${dateDataArray[1]}-${dateDataArray[2]}-${dateDataArray[0]}`;
  };

  const handleStatusChange = async (e: any) => {
    const newStatus = e.target.value as 'active' | 'planning' | 'completed';

    // If changing to completed, run the completion flow
    if (newStatus === 'completed') {
      const isSuccess = await onSprintComplete(sprint.id);
      if (!isSuccess) return;
    }

    const data = { status: newStatus };
    updateSprint(sprint.id, data)
      .then((res) => {
        projectDetails.onUpdateSprint(sprint.id, res);
      })
      .catch(() => {
        toast.error('Temporary Server Error. Try Again.', { theme: 'colored' });
      });
  };

  const statusOptions = [
    { label: 'Planning Sprint', value: 'planning' },
    { label: 'Active Sprint', value: 'active' },
    { label: 'Complete Sprint', value: 'completed' }
  ];

  return (
    <section className="w-full box-border bg-gray-200 p-2 rounded-md mb-5" data-testid={dataTestId}>
      <div className="flex justify-between items-center py-1">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold inline truncate">{sprint.name}</h1>
          <div className="flex">
            <div className="flex items-center gap-1">
              <p className="m-0 p-0">{dateWithDay(sprint.startDate)}</p>
              <BsArrowRight />
              <p className="m-0 p-0"> {dateWithDay(sprint.endDate)}</p>
            </div>
            <div className="ml-2\.5 truncate whitespace-nowrap"> ({totalIssue} tickets)</div>
          </div>
        </div>
        {checkAccess(Permission.EditSprints, projectId) && (
          <div className="flex flex-nowrap items-center gap-2">
            <Dropdown
              label=""
              name="sprint-status"
              options={statusOptions}
              value={sprint.status || 'planning'}
              onValueChanged={handleStatusChange}
              hasBorder={false}
              dataTestId={`sprint-status-dropdown-${sprint.id}`}
            />
            <IconButton
              icon={<BiDotsHorizontal />}
              tooltip="Actions"
              onClick={() => {
                showModal(
                  'create-sprint',
                  <CreateEditSprint
                    type="Edit"
                    projectDetails={projectDetails}
                    onClickCloseModal={() => {
                      closeModal('create-sprint');
                    }}
                    currentSprint={sprint}
                    projectId={projectId}
                  />
                );
              }}
            />
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
