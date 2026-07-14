/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, createRef, useEffect, useContext } from 'react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { HiDotsHorizontal } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { IoIosAdd } from 'react-icons/io';
import { createProject, deleteProject, updateProject } from '../../api/projects/projects';
import { IProject, IProjectData, IMinEvent } from '../../types';
import { ProjectContext, ProjectDispatchContext } from '../../context/ProjectProvider';
import checkAccess, { clickedShowMore } from '../../utils/helpers';
import ProjectEditor from '../../components/Projects/ProjectEditor/ProjectEditor';
import MainMenuV2 from '../../components/Navigations/MainMenuV2';
import ButtonV2 from '../../lib/FormV2/ButtonV2/ButtonV2';
import Modal from '../../lib/Modal/Modal';
import DefaultModalHeader from '../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import Avatar from '../../components/Avatar/Avatar';
import { importProject, importProjects } from '../../api/importProject/importProject';
import { exportProject } from '../../api/exportProject/exportProject';
import { UserContext } from '../../context/UserInfoProvider';
import { Permission } from '../../utils/permission';
import Dropdown from '../../lib/FormV3/Dropdown/Dropdown';
import SectionTitle from '../../components/SectionTitle/SectionTitle';

export default function ProjectPage() {
  const fetchProjects = useContext(ProjectDispatchContext);
  const projectList = useContext<IProject[]>(ProjectContext);
  const [showProjectDetails, setShowProjectDetails] = useState(-1);
  const [value, setValue] = useState(0);
  const refProfile = projectList.map(() => createRef<HTMLDivElement>());
  const refShowMore = projectList.map(() => createRef<HTMLDivElement>());
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string>('');
  const [importDropdownValue, setImportDropdownValue] = useState<string | null>(null);
  const navigate = useNavigate();
  const userInfo = useContext(UserContext);
  const { isCurrentUserOwner } = userInfo;

  const allowedCsvType = ['text/csv'];
  const allowedJsonType = ['application/json'];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (isCurrentUserOwner !== undefined) {
      localStorage.setItem('isCurrentUserOwner', JSON.stringify(isCurrentUserOwner));
    }
  }, [isCurrentUserOwner]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (!urlToken) {
      return;
    }
    const storedToken = localStorage.getItem('access_token');
    if (urlToken !== storedToken) {
      navigate('/login');
    }
  }, [navigate]);

  const fileInputRefCsv = React.useRef<HTMLInputElement>(null);
  const fileInputRefJson = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null, fileType: 'csv' | 'json') => {
    if (!files || files.length === 0) {
      return;
    }

    const allowedTypes = fileType === 'csv' ? allowedCsvType : allowedJsonType;
    const fileExtension = fileType === 'csv' ? 'CSV' : 'JSON';

    if (!allowedTypes.includes(files[0].type) && files[0].type !== '') {
      // Check file extension as fallback
      const fileName = files[0].name.toLowerCase();
      const hasValidExtension =
        fileType === 'csv' ? fileName.endsWith('.csv') : fileName.endsWith('.json');

      if (!hasValidExtension) {
        toast.error(`File type is not supported, please upload a ${fileExtension} file`, {
          theme: 'colored'
        });
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', files[0]);

    if (fileType === 'csv') {
      await importProjects(formData);
      toast.success('Upload successful! Fresh to see imported project', { theme: 'colored' });
      return;
    }
    await importProject(formData);
    toast.success('Upload successful! Fresh to see imported project', { theme: 'colored' });
  };

  const handleImportDropdownChange = (e: IMinEvent) => {
    const { value: dropdownValue } = e.target;
    if (dropdownValue === 'import-from-j') {
      fileInputRefCsv.current?.click();
      setImportDropdownValue(null);
    } else if (dropdownValue === 'import-json') {
      fileInputRefJson.current?.click();
      setImportDropdownValue(null);
    }
  };

  const handleExportProject = async (projectId: string) => {
    await exportProject(projectId);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setProjectStar = (id: string) => {
    // const projectIndex = projectList.findIndex((project: IProjectData) => project.id === id);
    // projectList[projectIndex].star = !projectList[projectIndex].star; //TODO: this is attach to user not global
    setValue(value + 1);
  };

  const removeProject = async (id: string) => {
    try {
      setLoading(true);
      await deleteProject(id);
      await fetchProjects();
      toast.success('Project has been deleted', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    } catch (error) {
      toast.error('Temporary Server Error. Try Again.', { theme: 'colored' });
    } finally {
      setShowDeleteModal(false);
      setLoading(false);
      setSubmitting(false);
    }
  };

  const starProject = (id: string, data: IProjectData) => {
    setProjectStar(id);
    updateProject(id, data).then(() => {
      fetchProjects();
    });
  };

  const viewDetailPosition = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
    const mouseDetailPosition = e.currentTarget.getBoundingClientRect();

    const viewPosition = {
      x: mouseDetailPosition.left + window.scrollX,
      y: mouseDetailPosition.top + window.scrollY
    };
    const { current } = refProfile[id];
    if (current !== null) {
      current.style.top = `${viewPosition.y - 170}px`;
      current.style.left = `${viewPosition.x + 50}px`;
    }
  };

  const handleClickInside = (e: MouseEvent) => {
    if (!clickedShowMore(e, refShowMore)) {
      setShowProjectDetails(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickInside);
    return () => document.removeEventListener('mousedown', handleClickInside);
  });

  const onClickProjectSave = async (apiData: IProjectData) => {
    try {
      setLoading(true);
      const res: AxiosResponse = await createProject(apiData);
      if (!res.data) {
        return;
      }
      await fetchProjects();
      toast.success('Project has been created', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    } catch (error) {
      toast.error('Temporary Server Error. Try Again.', { theme: 'colored' });
    } finally {
      setShowCreateProjectModal(false);
      setLoading(false);
    }
  };

  const renderModals = () => {
    return (
      <>
        {showCreateProjectModal && (
          <Modal fullWidth>
            <DefaultModalHeader
              title="Create Project"
              onClickClose={() => {
                setShowCreateProjectModal(false);
              }}
            />
            <DefaultModalBody defaultPadding={false} classesName="px-10 py-6">
              <ProjectEditor
                showCancelBtn
                onClickSave={onClickProjectSave}
                onClickCancel={() => {
                  setShowCreateProjectModal(false);
                }}
                loading={loading}
              />
            </DefaultModalBody>
          </Modal>
        )}
        {showDeleteModal && (
          <Modal classesName="p-6">
            <p>Are you sure you want to delete the project?</p>
            <div className="flex justify-end gap-4 mt-8">
              <ButtonV2
                text="Confirm"
                danger
                onClick={() => {
                  setSubmitting(true);
                  removeProject(deleteProjectId);
                }}
                disabled={submitting}
                dataTestId="confirm-delete"
              />
              <ButtonV2
                text="Cancel"
                fill
                onClick={() => {
                  setShowDeleteModal(false);
                }}
                dataTestId="confirm-cancel"
              />
            </div>
          </Modal>
        )}
      </>
    );
  };

  const renderHeaderMenu = () => {
    return (
      <div>
        <div data-testid="project-title">
          <SectionTitle>Projects</SectionTitle>

          {checkAccess(Permission.CreateProjects) && (
            <div className="flex items-center gap-4 justify-end">
              <ButtonV2
                customStyles="p-3"
                text="New project"
                onClick={() => setShowCreateProjectModal(true)}
                icon={
                  <IoIosAdd
                    style={{
                      borderRadius: '5px',
                      backgroundColor: 'rgba(246, 248, 251, 0.15)',
                      width: '20px',
                      height: '20px',
                      padding: '5px',
                      marginRight: '10px'
                    }}
                  />
                }
                fill
                dataTestId="board-create-card"
              />

              <input
                type="file"
                ref={fileInputRefCsv}
                accept=".csv"
                onChange={(e) => {
                  handleFileUpload(e.target.files, 'csv');
                }}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={fileInputRefJson}
                accept=".json"
                onChange={(e) => {
                  handleFileUpload(e.target.files, 'json');
                }}
                style={{ display: 'none' }}
              />
              <div>
                <Dropdown
                  name="import-dropdown"
                  label=""
                  placeHolder="Import"
                  value={importDropdownValue}
                  options={[
                    { label: 'Import J', value: 'import-from-j' },
                    { label: 'Import JSON', value: 'import-json' }
                  ]}
                  onValueChanged={handleImportDropdownChange}
                  hasBorder
                  dataTestId="import-dropdown"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShowMore = (projectId, index: number) => {
    return (
      <td
        className="relative vertical-middle"
        onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => viewDetailPosition(e, index)}
        onFocus={() => undefined}
      >
        {showProjectDetails === projectId && (
          <div
            className="absolute shadow-lg min-w-125 bg-white flex flex-col items-start rounded-lg z-1000"
            ref={refShowMore[index]}
            style={{ top: '30px', left: '-50px' }}
          >
            {checkAccess(Permission.ViewProjects, projectId) && (
              <Link to={`/projects/${projectId}/settings`} className="block">
                <button
                  type="button"
                  data-testid="project-details"
                  className="p-3 bg-transparent button-hover-default"
                >
                  View Detail
                </button>
              </Link>
            )}
            {checkAccess(Permission.DeleteProjects, projectId) && (
              <button
                type="button"
                data-testid="project-delete"
                onClick={() => {
                  setDeleteProjectId(projectId);
                  setShowDeleteModal(true);
                }}
                className="p-3 bg-transparent button-hover-default"
              >
                Delete Project
              </button>
            )}
            <button
              type="button"
              data-testid="project-export"
              className="p-3 bg-transparent button-hover-default"
              onClick={() => {
                handleExportProject(projectId);
              }}
            >
              Export Project
            </button>
          </div>
        )}
        {(checkAccess(Permission.ViewProjects, projectId) ||
          checkAccess(Permission.DeleteProjects, projectId)) && (
          <div>
            <HiDotsHorizontal
              onClick={() => {
                setShowProjectDetails(projectId);
              }}
              className="pointer-cursor"
              data-testid={`project-expand-btn-${projectId}`}
            />
          </div>
        )}
      </td>
    );
  };

  const renderTable = () => {
    return (
      <div className={['p-0', 'm-0', 'relative'].join(' ')}>
        <table aria-label="Projects details" className="w-full table-collapse">
          <thead className="border-b-3  border-primary">
            <tr className="text-left text-sm" style={{ height: '45px' }}>
              <th className={['text-center'].join(' ')} style={{ width: '2.85%' }}>
                <AiFillStar size={15} />
              </th>
              <th style={{ width: '22%' }}>
                <span>Name</span>
              </th>
              <th style={{ width: '12%' }}>
                <span>Key</span>
              </th>
              <th style={{ width: '20%' }}>
                <span>Type</span>
              </th>
              <th>
                <span>Lead</span>
              </th>
              <th style={{ width: '4.25%' }}>
                <span />
              </th>
            </tr>
          </thead>
          <tbody>
            {projectList.map((project: IProjectData, index: number) => (
              <tr
                key={project.id}
                className="overflow-visible hover-background-light-grey w-full text-left"
                style={{ height: '45px' }}
              >
                <td className={['overflow-visible'].join(' ')}>
                  <div
                    className={['overflow-visible', 'text-center'].join(' ')}
                    onFocus={() => undefined}
                  >
                    <button
                      type="button"
                      className={['button-clear', 'overflow-visible'].join(' ')}
                      onClick={() => {
                        starProject(project.id, { star: true }); // TODO: this is not base on project but user
                      }}
                    >
                      {project.star ? (
                        <AiFillStar size={20} title="Remove from Starred" />
                      ) : (
                        <AiOutlineStar size={20} title="Add to Starred" />
                      )}
                    </button>
                  </div>
                </td>
                <td data-testid={project.name.replace(' ', '-').toLowerCase()}>
                  <Link to={`/projects/${project.id}/board`} className="block">
                    <div className="flex items-center text-sm">
                      {/* Always use a vector icon for project avatar (no image) */}
                      {/* eslint-disable-next-line react/no-unknown-property */}
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="var(--primary-color)"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-label={`${project.name} icon`}
                        style={{ marginRight: 8 }}
                      >
                        <path d="M10 4H4c-1.1 0-2 .9-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
                      </svg>
                      <span data-testid="project-name">{project.name}</span>
                    </div>
                  </Link>
                </td>
                <td>
                  <span className="text-xs">{project.key}</span>
                </td>
                <td>
                  <div>
                    <span>{project.type}</span>
                  </div>
                </td>
                <td>
                  <div onFocus={() => undefined}>
                    <Avatar
                      size={30}
                      avatarIcon={project?.projectLead?.avatarIcon}
                      backgroundColor={project?.projectLead?.backgroundColor}
                      name={project?.projectLead?.name}
                    />
                  </div>
                </td>
                {renderShowMore(project.id, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <MainMenuV2 />
      <div className={['px-6', 'py-6'].join(' ')}>
        <div className={['overflow-visible'].join(' ')}>
          {renderHeaderMenu()}
          {renderTable()}
        </div>
      </div>
      {renderModals()}
    </div>
  );
}
