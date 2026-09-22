import { jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { X, DollarSign, Calendar, FileText, AlertCircle } from "../../utils/icons/icons";
import { todayKey } from "../../../utils/dates/parseDates";
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;
const Modal = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.3s ease-out;
`;
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #E3DDD0;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #15171A;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg {
      color: #8B7355;
    }
  }
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6B6862;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: #C77B5E;
    transform: rotate(90deg);
  }
`;
const Alert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.25rem;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  color: #1E40AF;
  font-size: 0.875rem;

  svg {
    flex-shrink: 0;
    color: #3B82F6;
  }
`;
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr 1fr"};
  gap: 1rem;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #15171A;
    display: flex;
    align-items: center;
    gap: 0.375rem;

    svg {
      color: #8B7355;
      width: 14px;
      height: 14px;
    }

    .required {
      color: #C77B5E;
    }
  }

  input,
  select,
  textarea {
    padding: 0.625rem 0.875rem;
    border: 1px solid #E3DDD0;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-family: inherit;
    transition: all 0.2s ease;
    background: white;

    &:focus {
      outline: none;
      border-color: #8B7355;
      box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
    }

    &::placeholder {
      color: #8B8882;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;
const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #E3DDD0;

  @media (max-width: 576px) {
    flex-direction: column-reverse;
  }
`;
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${(props) => props.$variant === "primary" ? "#8B7355" : props.$variant === "danger" ? "#C77B5E" : "#E3DDD0"};
  background: ${(props) => props.$variant === "primary" ? "#8B7355" : props.$variant === "danger" ? "#C77B5E" : "white"};
  color: ${(props) => props.$variant === "primary" || props.$variant === "danger" ? "white" : "#15171A"};
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
  font-family: inherit;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: ${(props) => props.$variant === "primary" ? "#A98F6E" : props.$variant === "danger" ? "#A66B52" : "#FAF8F4"};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
const ExtraChargeForm = ({ deceased, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    deceased_id: deceased?.id || deceased?.deceased_id,
    charge_type: "",
    amount: "",
    description: "",
    notes: "",
    service_date: todayKey()
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (deceased) {
      setFormData((prev) => ({
        ...prev,
        deceased_id: deceased.id || deceased.deceased_id
      }));
    }
  }, [deceased]);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.charge_type.trim()) {
      newErrors.charge_type = "Charge type is required";
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    onSubmit(submitData);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  return /* @__PURE__ */ jsx(Overlay, { onClick: onClose, children: /* @__PURE__ */ jsxs(Modal, { onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs(ModalHeader, { children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx(DollarSign, { size: 20 }),
        "Add Extra Charge"
      ] }),
      /* @__PURE__ */ jsx(CloseButton, { onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 20 }) })
    ] }),
    /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(AlertCircle, { size: 18 }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "Adding charge for:" }),
        " ",
        deceased?.full_name || "Unknown",
        " (",
        deceased?.deceased_id || "N/A",
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Form, { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxs(FormRow, { $columns: "1fr 1fr", children: [
        /* @__PURE__ */ jsxs(FormGroup, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Charge Type ",
            /* @__PURE__ */ jsx("span", { className: "required", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "charge_type",
              value: formData.charge_type,
              onChange: handleChange,
              placeholder: "e.g., Transportation, Special Care, etc.",
              className: errors.charge_type ? "error" : ""
            }
          ),
          errors.charge_type && /* @__PURE__ */ jsx("span", { style: { color: "#C77B5E", fontSize: "0.75rem" }, children: errors.charge_type })
        ] }),
        /* @__PURE__ */ jsxs(FormGroup, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Amount (KES) ",
            /* @__PURE__ */ jsx("span", { className: "required", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              name: "amount",
              value: formData.amount,
              onChange: handleChange,
              step: "0.01",
              min: "0",
              placeholder: "0.00",
              className: errors.amount ? "error" : ""
            }
          ),
          errors.amount && /* @__PURE__ */ jsx("span", { style: { color: "#C77B5E", fontSize: "0.75rem" }, children: errors.amount })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(FormRow, { $columns: "1fr 1fr", children: [
        /* @__PURE__ */ jsxs(FormGroup, { children: [
          /* @__PURE__ */ jsx("label", { children: "Description" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "description",
              value: formData.description,
              onChange: handleChange,
              placeholder: "Brief description of the charge"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(FormGroup, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx(Calendar, { size: 14 }),
            "Service Date"
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              name: "service_date",
              value: formData.service_date,
              onChange: handleChange
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(FormGroup, { children: [
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx(FileText, { size: 14 }),
          "Notes"
        ] }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            name: "notes",
            value: formData.notes,
            onChange: handleChange,
            rows: "3",
            placeholder: "Additional notes about this charge..."
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(ButtonGroup, { children: [
        /* @__PURE__ */ jsx(Button, { type: "button", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsxs(Button, { type: "submit", $variant: "primary", disabled: isLoading, children: [
          /* @__PURE__ */ jsx(DollarSign, { size: 16 }),
          isLoading ? "Adding..." : "Add Charge"
        ] })
      ] })
    ] })
  ] }) });
};
export default ExtraChargeForm;
