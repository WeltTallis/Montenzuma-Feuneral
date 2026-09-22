import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import api from "../../../api/axios";
import { ENDPOINTS } from "../../../api/endpoints";
import { todayKey } from "../../../utils/dates/parseDates";
const Colors = {
  ink: "#15171A",
  bone: "#FAF8F4",
  bone2: "#F3EFE6",
  brass: "#8B7355",
  brassHover: "#A98F6E",
  verdigris: "#3D4F47",
  verdigrisDark: "#2E3F37",
  line: "#E3DDD0",
  gray: "#6B6862",
  red: "#9B4A3F",
  redBg: "#F7ECE9",
  success: "#475A43",
  successBg: "#EEF3EC",
  white: "#FFFFFF",
  textMuted: "#8B8882",
  darkGray: "#2C2F33",
  mediumGray: "#E3DDD0"
};
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(21, 23, 26, 0.88);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;
const ModalBox = styled.div`
  background: ${Colors.white};
  border-radius: 1.25rem;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.3s ease-out;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${Colors.mediumGray};
    border-radius: 3px;
  }
`;
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${Colors.line};
  background: linear-gradient(135deg, ${Colors.ink} 0%, ${Colors.verdigrisDark} 100%);

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: ${Colors.bone};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  svg {
    color: ${Colors.brassLight};
    width: 20px;
    height: 20px;
  }
`;
const ModalClose = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: ${Colors.bone};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;
const ModalBody = styled.div`
  padding: 1.5rem;
`;
const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${Colors.line};
`;
const FormGroup = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${Colors.darkGray};
    margin-bottom: 0.375rem;
  }
`;
const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.625rem;
  border: 2px solid ${Colors.mediumGray};
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: ${Colors.white};
  color: ${Colors.ink};
  font-family: inherit;

  &:focus {
    border-color: ${Colors.brass};
    box-shadow: 0 0 0 4px rgba(139, 115, 85, 0.1);
    outline: none;
  }

  &::placeholder {
    color: ${Colors.textMuted};
  }
`;
const FormSelect = styled.select`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: 0.625rem;
  border: 2px solid ${Colors.mediumGray};
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: ${Colors.white};
  color: ${Colors.ink};
  font-family: inherit;
  cursor: pointer;

  &:focus {
    border-color: ${Colors.brass};
    box-shadow: 0 0 0 4px rgba(139, 115, 85, 0.1);
    outline: none;
  }
`;
const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${Colors.mediumGray};
  background: ${Colors.white};
  color: ${Colors.darkGray};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 38px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${Colors.brass};
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

  &.primary {
    background: linear-gradient(135deg, ${Colors.brass} 0%, ${Colors.brassHover} 100%);
    color: ${Colors.white};
    border-color: transparent;
    box-shadow: 0 4px 6px -1px rgba(139, 115, 85, 0.3);

    &:hover:not(:disabled) {
      box-shadow: 0 10px 20px -5px rgba(139, 115, 85, 0.4);
      border-color: transparent;
    }
  }

  &.danger {
    background: linear-gradient(135deg, ${Colors.red} 0%, #7A3A30 100%);
    color: white;
    border-color: transparent;

    &:hover:not(:disabled) {
      box-shadow: 0 10px 20px -5px rgba(155, 74, 63, 0.3);
      border-color: transparent;
    }
  }
`;
const AlertBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  background: ${(props) => props.$type === "error" ? Colors.redBg : Colors.successBg};
  color: ${(props) => props.$type === "error" ? Colors.red : Colors.success};
  border: 1px solid ${(props) => props.$type === "error" ? "#E8D2CC" : "#DCE6D9"};

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }
`;
const ChargesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;
const ChargeItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: ${Colors.bone};
  border-radius: 0.75rem;
  border: 1px solid ${Colors.line};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${Colors.brassLight};
    background: ${Colors.white};
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;
const ChargeInfo = styled.div`
  flex: 1;

  h6 {
    font-size: 0.9375rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: ${Colors.ink};
  }

  small {
    font-size: 0.8125rem;
    color: ${Colors.textMuted};
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
`;
const ChargeAmount = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${Colors.red};
  white-space: nowrap;
  margin-right: 1rem;
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${Colors.textMuted};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h5 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: ${Colors.darkGray};
  }

  p {
    font-size: 0.875rem;
    margin: 0;
  }
`;
const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: ${Colors.brass};

  svg {
    animation: ${keyframes`
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    `} 1s linear infinite;
    width: 32px;
    height: 32px;
    margin-bottom: 1rem;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: ${Colors.textMuted};
  }
`;
function ExtraChargesModal({ deceased, onClose, onRefresh }) {
  const [charges, setCharges] = useState(deceased?.charges || []);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    charge_type: "",
    amount: "",
    description: "",
    notes: "",
    service_date: todayKey()
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (!formData.charge_type || !formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please fill in all required fields with valid values");
      setSubmitting(false);
      return;
    }
    try {
      const tenantSlug = localStorage.getItem("tenantSlug");
      const response = await api.post(
        ENDPOINTS.INVOICE.EXTRA_CHARGE,
        {
          ...formData,
          deceased_id: deceased.deceased_id,
          amount: parseFloat(formData.amount)
        },
        {
          headers: {
            "x-tenant-slug": tenantSlug
          }
        }
      );
      if (response.data?.success) {
        setSuccess("Extra charge added successfully!");
        setFormData({
          charge_type: "",
          amount: "",
          description: "",
          notes: "",
          service_date: todayKey()
        });
        const newCharge = response.data.data || response.data.charge;
        if (newCharge) {
          setCharges((prev) => [...prev, newCharge]);
        }
        if (onRefresh) onRefresh();
      } else {
        throw new Error(response.data?.message || "Failed to add charge");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add extra charge");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (chargeId) => {
    if (!window.confirm("Are you sure you want to delete this charge?")) return;
    try {
      const tenantSlug = localStorage.getItem("tenantSlug");
      const response = await api.delete(
        `${ENDPOINTS.INVOICE.EXTRA_CHARGE}/${chargeId}`,
        {
          headers: {
            "x-tenant-slug": tenantSlug
          }
        }
      );
      if (response.data?.success) {
        setCharges((prev) => prev.filter((c) => c.charge_id !== chargeId));
        setSuccess("Charge deleted successfully");
        if (onRefresh) onRefresh();
      } else {
        throw new Error(response.data?.message || "Failed to delete charge");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete charge");
    }
  };
  const totalExtraCharges = charges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
  return /* @__PURE__ */ jsx(ModalOverlay, { onClick: onClose, children: /* @__PURE__ */ jsxs(ModalBox, { onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs(ModalHeader, { children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        /* @__PURE__ */ jsx(DollarSign, {}),
        "Extra Charges - ",
        deceased?.full_name || "Deceased"
      ] }),
      /* @__PURE__ */ jsx(ModalClose, { onClick: onClose, children: /* @__PURE__ */ jsx(X, {}) })
    ] }),
    /* @__PURE__ */ jsxs(ModalBody, { children: [
      error && /* @__PURE__ */ jsxs(AlertBox, { $type: "error", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 18 }),
        /* @__PURE__ */ jsx("span", { children: error })
      ] }),
      success && /* @__PURE__ */ jsxs(AlertBox, { $type: "success", children: [
        /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
        /* @__PURE__ */ jsx("span", { children: success })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsxs(FormRow, { children: [
          /* @__PURE__ */ jsxs(FormGroup, { children: [
            /* @__PURE__ */ jsx("label", { children: "Charge Type *" }),
            /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "text",
                name: "charge_type",
                value: formData.charge_type,
                onChange: handleChange,
                placeholder: "e.g., Transportation, Special Casket, Embalming",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(FormGroup, { children: [
            /* @__PURE__ */ jsx("label", { children: "Amount (KES) *" }),
            /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "number",
                name: "amount",
                value: formData.amount,
                onChange: handleChange,
                placeholder: "0.00",
                step: "0.01",
                min: "0",
                required: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(FormRow, { children: [
          /* @__PURE__ */ jsxs(FormGroup, { children: [
            /* @__PURE__ */ jsx("label", { children: "Service Date" }),
            /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "date",
                name: "service_date",
                value: formData.service_date,
                onChange: handleChange
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(FormGroup, { children: [
            /* @__PURE__ */ jsx("label", { children: "Description" }),
            /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "text",
                name: "description",
                value: formData.description,
                onChange: handleChange,
                placeholder: "Brief description of the charge"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(FormGroup, { children: [
          /* @__PURE__ */ jsx("label", { children: "Notes" }),
          /* @__PURE__ */ jsx(
            FormInput,
            {
              type: "text",
              name: "notes",
              value: formData.notes,
              onChange: handleChange,
              placeholder: "Additional notes (optional)"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "primary", disabled: submitting, children: submitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }),
          "Adding..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Plus, { size: 16 }),
          "Add Extra Charge"
        ] }) })
      ] }),
      charges.length > 0 && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { style: {
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: `2px solid ${Colors.line}`
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }, children: [
          /* @__PURE__ */ jsxs("h4", { style: {
            margin: 0,
            fontSize: "1rem",
            fontWeight: 700,
            color: Colors.ink
          }, children: [
            "Existing Charges (",
            charges.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("div", { style: {
            fontSize: "1.125rem",
            fontWeight: 700,
            color: Colors.red
          }, children: [
            "Total: Ksh ",
            totalExtraCharges.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsx(ChargesList, { children: charges.map((charge) => /* @__PURE__ */ jsxs(ChargeItem, { children: [
          /* @__PURE__ */ jsxs(ChargeInfo, { children: [
            /* @__PURE__ */ jsx("h6", { children: charge.charge_type }),
            /* @__PURE__ */ jsxs("small", { children: [
              /* @__PURE__ */ jsx(Calendar, { size: 12 }),
              charge.service_date || "No date"
            ] }),
            charge.description && /* @__PURE__ */ jsxs("small", { children: [
              /* @__PURE__ */ jsx(FileText, { size: 12 }),
              charge.description
            ] }),
            charge.notes && /* @__PURE__ */ jsx("small", { style: { fontStyle: "italic" }, children: charge.notes })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "1rem" }, children: [
            /* @__PURE__ */ jsxs(ChargeAmount, { children: [
              "Ksh ",
              parseFloat(charge.amount || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                className: "danger",
                onClick: () => handleDelete(charge.charge_id),
                style: { padding: "0.5rem", minHeight: "32px" },
                children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
              }
            )
          ] })
        ] }, charge.charge_id)) })
      ] }) }),
      !loading && charges.length === 0 && /* @__PURE__ */ jsxs(EmptyState, { children: [
        /* @__PURE__ */ jsx(DollarSign, {}),
        /* @__PURE__ */ jsx("h5", { children: "No Extra Charges" }),
        /* @__PURE__ */ jsx("p", { children: "No additional charges have been added yet. Use the form above to add charges." })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ModalFooter, { children: /* @__PURE__ */ jsx(Button, { onClick: onClose, children: "Close" }) })
  ] }) });
}
export default ExtraChargesModal;
