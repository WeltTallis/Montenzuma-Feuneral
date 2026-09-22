import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled, { keyframes } from "styled-components";
import THEME from "../../utils/colors/theme";
import { toDateKey } from "../../utils/dates/parseDates";
import { ENDPOINTS } from "../../api/endpoints";
import api from "../../api/axios";
import { User, CalendarDays, Edit, X, Save, Info, RefreshCw } from "../../utils/icons/icons";
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;
const slideRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;
const Container = styled.div`
  background: ${THEME.colors.white};
  border-radius: 6px;
  padding: 0.75rem;
  border: 1px solid ${THEME.colors.line};
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${THEME.colors.line};
  flex-wrap: wrap;
  gap: 0.5rem;
`;
const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${THEME.colors.ink};
  display: flex;
  align-items: center;
  gap: 0.4rem;

  svg {
    color: ${THEME.colors.gray};
    stroke-width: 2;
  }
`;
const Badge = styled.span`
  background: ${THEME.colors.line};
  color: ${THEME.colors.gray};
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-block;
`;
const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;
const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${THEME.colors.line};
  white-space: nowrap;

  &.primary {
    background: ${THEME.colors.verdigris};
    color: ${THEME.colors.white};
    border-color: ${THEME.colors.verdigris};

    &:hover {
      background: #2d3f37;
      border-color: #2d3f37;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: ${THEME.colors.white};
    color: ${THEME.colors.ink};

    &:hover {
      background: ${THEME.colors.line};
    }
  }

  &.success {
    background: ${THEME.colors.success};
    color: ${THEME.colors.white};
    border-color: ${THEME.colors.success};

    &:hover {
      background: #3d4a3a;
      border-color: #3d4a3a;
    }
  }
`;
const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (min-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const DataGroup = styled.div`
  padding: 1.25rem 0;
  border-bottom: 1px solid ${THEME.colors.line};

  &:last-child {
    border-bottom: none;
  }
`;
const GroupTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${THEME.colors.brass};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
`;
const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  gap: 1rem;
`;
const Label = styled.span`
  color: ${THEME.colors.gray};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  flex-shrink: 0;
  min-width: fit-content;
`;
const Value = styled.span`
  color: ${THEME.colors.ink};
  font-weight: ${(props) => props.bold ? "700" : "600"};
  text-align: right;
  word-break: break-word;
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.5;

  .status-badge {
    background: ${(props) => props.statusColor || THEME.colors.gray};
    color: ${THEME.colors.bone};
    padding: 0.35rem 0.9rem;
    border-radius: 25px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
    margin-left: 0.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    letter-spacing: 0.3px;
  }
`;
const EditForm = styled.div`
  background: ${THEME.colors.bone};
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid ${THEME.colors.line};
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
const FormGroup = styled.div`
  margin-bottom: 1rem;
`;
const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${THEME.colors.ink};
  margin-bottom: 0.4rem;
`;
const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${THEME.colors.line};
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: ${THEME.colors.white};

  &:focus {
    outline: none;
    border-color: ${THEME.colors.brass};
    box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
  }
`;
const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${THEME.colors.line};
  border-radius: 10px;
  font-size: 0.9rem;
  background: ${THEME.colors.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${THEME.colors.brass};
    box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
  }
`;
const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${THEME.colors.gray};
  font-size: 1rem;
  gap: 0.75rem;

  .spinner {
    border: 3px solid ${THEME.colors.line};
    border-top: 3px solid ${THEME.colors.brass};
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
const NoData = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${THEME.colors.gray};
  font-size: 1rem;
`;
const fieldGroups = [
  {
    title: "Personal Information",
    icon: User,
    fields: [
      { key: "full_name", label: "Full Name", bold: true },
      { key: "gender", label: "Gender" },
      { key: "date_of_birth", label: "Date of Birth" },
      { key: "date_of_death", label: "Date of Death" }
    ]
  },
  {
    title: "Timeline",
    icon: CalendarDays,
    fields: [
      { key: "date_admitted", label: "Admitted On" },
      { key: "dispatch_date", label: "Dispatch Date" }
    ]
  }
];
const formFields = [
  {
    section: "Personal Information",
    icon: User,
    fields: [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
      { name: "date_of_birth", label: "Date of Birth", type: "date" },
      { name: "date_of_death", label: "Date of Death", type: "date" }
    ]
  }
];
const DeceasedInfoSection = ({ deceasedId: propDeceasedId, deceased: propDeceased, ageInfo, onUpdate }) => {
  const { id: paramId } = useParams();
  const deceasedId = propDeceasedId || paramId;
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchDeceasedData = useCallback(async () => {
    if (!deceasedId) {
      setIsLoading(false);
      setError("No deceased ID provided");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = `${ENDPOINTS.DECEASED.BASE}/deceased-id/${deceasedId}`;
      const response = await api.get(endpoint);
      console.log("\u{1F4E6} DeceasedInfoSection API Response:", response.data);
      const deceasedData = response.data?.data || response.data;
      if (deceasedData && Object.keys(deceasedData).length > 0) {
        const cleanedData = {
          ...deceasedData,
          date_of_birth: deceasedData.date_of_birth ? toDateKey(deceasedData.date_of_birth) : "",
          date_of_death: deceasedData.date_of_death ? toDateKey(deceasedData.date_of_death) : "",
          date_admitted: deceasedData.date_admitted ? toDateKey(deceasedData.date_admitted) : "",
          dispatch_date: deceasedData.dispatch_date ? toDateKey(deceasedData.dispatch_date) : ""
        };
        setFormData(cleanedData);
        setOriginalData(cleanedData);
      } else {
        setError("No data found for this deceased record");
        setFormData(null);
        setOriginalData(null);
      }
    } catch (error2) {
      console.error("Error fetching data:", error2);
      const errorMessage = error2.response?.data?.message || error2.message || "Failed to load deceased information";
      setError(errorMessage);
      toast.error(errorMessage);
      setFormData(null);
      setOriginalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [deceasedId]);
  useEffect(() => {
    if (propDeceased) {
      const cleanedData = {
        ...propDeceased,
        date_of_birth: propDeceased.date_of_birth ? toDateKey(propDeceased.date_of_birth) : "",
        date_of_death: propDeceased.date_of_death ? toDateKey(propDeceased.date_of_death) : ""
      };
      setFormData(cleanedData);
      setOriginalData(cleanedData);
      setIsLoading(false);
    } else {
      fetchDeceasedData();
    }
  }, [propDeceased, fetchDeceasedData, deceasedId]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = async () => {
    if (!formData || !deceasedId) {
      toast.error("No data to save");
      return;
    }
    setIsLoading(true);
    try {
      const updateEndpoint = `${ENDPOINTS.DECEASED.BASE}/${deceasedId}`;
      const response = await api.put(updateEndpoint, formData);
      if (response.data.success) {
        toast.success("Details updated successfully");
        setIsEditMode(false);
        await fetchDeceasedData();
        onUpdate?.();
      } else {
        toast.error(response.data.message || "Failed to update details");
      }
    } catch (error2) {
      console.error("Update error:", error2);
      const errorMessage = error2.response?.data?.message || error2.message || "Failed to update details";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    setFormData(originalData);
    setIsEditMode(false);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const renderFieldValue = (field, data) => {
    let value = data[field.key];
    if (!value && value !== 0) {
      return /* @__PURE__ */ jsx(Value, { children: "-" });
    }
    if (field.key.includes("date")) {
      value = formatDate(value);
    }
    return /* @__PURE__ */ jsx(Value, { bold: field.bold, children: value });
  };
  const renderFormSection = (section, sectionIndex) => /* @__PURE__ */ jsxs(DataGroup, { children: [
    /* @__PURE__ */ jsxs(GroupTitle, { children: [
      React.createElement(section.icon, { size: 18 }),
      section.title
    ] }),
    section.fields.map((field, fieldIndex) => /* @__PURE__ */ jsxs(DataRow, { children: [
      /* @__PURE__ */ jsxs(Label, { children: [
        field.label,
        ":"
      ] }),
      renderFieldValue(field, formData)
    ] }, fieldIndex))
  ] }, sectionIndex);
  if (isLoading) {
    return /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsxs(Loading, { children: [
      /* @__PURE__ */ jsx("div", { className: "spinner" }),
      "Loading deceased information..."
    ] }) });
  }
  if (error || !formData) {
    return /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsxs(NoData, { children: [
      /* @__PURE__ */ jsx(Info, { size: 32, strokeWidth: 1.5 }),
      /* @__PURE__ */ jsx("div", { style: { marginTop: "1rem", color: THEME.colors.red }, children: error || "No data found for this deceased record" }),
      /* @__PURE__ */ jsxs(Button, { className: "secondary", onClick: fetchDeceasedData, style: { marginTop: "1rem" }, children: [
        /* @__PURE__ */ jsx(RefreshCw, { size: 16 }),
        "Retry"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(Container, { children: [
    /* @__PURE__ */ jsxs(Header, { children: [
      /* @__PURE__ */ jsxs(Title, { children: [
        /* @__PURE__ */ jsx(User, { size: 22 }),
        "Deceased Information"
      ] }),
      /* @__PURE__ */ jsx(Actions, { children: isEditMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(Button, { className: "success", onClick: handleSave, disabled: isLoading, children: [
          /* @__PURE__ */ jsx(Save, { size: 16 }),
          isLoading ? "Saving..." : "Save Changes"
        ] }),
        /* @__PURE__ */ jsxs(Button, { className: "secondary", onClick: handleCancel, disabled: isLoading, children: [
          /* @__PURE__ */ jsx(X, { size: 16 }),
          "Cancel"
        ] })
      ] }) : /* @__PURE__ */ jsxs(Button, { className: "primary", onClick: () => setIsEditMode(true), children: [
        /* @__PURE__ */ jsx(Edit, { size: 16 }),
        "Edit Information"
      ] }) })
    ] }),
    !isEditMode ? /* @__PURE__ */ jsx(DataGrid, { children: fieldGroups.map(renderFormSection) }) : /* @__PURE__ */ jsx(EditForm, { children: /* @__PURE__ */ jsx(FormGrid, { children: formFields.map((section, sectionIndex) => /* @__PURE__ */ jsxs(DataGroup, { children: [
      /* @__PURE__ */ jsxs(GroupTitle, { children: [
        React.createElement(section.icon, { size: 18 }),
        section.section
      ] }),
      section.fields.map((field, fieldIndex) => /* @__PURE__ */ jsxs(FormGroup, { children: [
        /* @__PURE__ */ jsx(FormLabel, { children: field.label }),
        field.type === "select" ? /* @__PURE__ */ jsxs(
          FormSelect,
          {
            name: field.name,
            value: formData[field.name] || "",
            onChange: handleInputChange,
            children: [
              /* @__PURE__ */ jsxs("option", { value: "", children: [
                "Select ",
                field.label
              ] }),
              field.options?.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option }, option))
            ]
          }
        ) : /* @__PURE__ */ jsx(
          FormInput,
          {
            type: field.type,
            name: field.name,
            value: formData[field.name] || "",
            onChange: handleInputChange,
            placeholder: `Enter ${field.label.toLowerCase()}`,
            required: field.required
          }
        )
      ] }, fieldIndex))
    ] }, sectionIndex)) }) })
  ] }) });
};
export default DeceasedInfoSection;
