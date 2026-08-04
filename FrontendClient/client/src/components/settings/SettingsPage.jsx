import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { tenantApi } from '../../api/tenant.api';
import { useTenantStore } from '../../modules/seo/useTenantStore';
import { showToast } from '../../utils/toast';

// ============================================================
// THEME & STYLED COMPONENTS
// ============================================================

const theme = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  lightGray: '#aaaaaa',
  border: '#c8c8c8',
  borderLight: '#e0e0e0',
  bgField: '#f7f7f5',
  bgAccent: '#f0eeea',
  bgSection: '#fafaf9',
  red: '#c0392b',
};

const PageWrapper = styled.div`
  background: ${theme.bgSection};
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: ${theme.dark};
`;

const ContentContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const HeaderContainer = styled.div`
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${theme.black};
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: ${theme.gray};
  margin: 0;
`;

const TabNav = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid ${theme.borderLight};
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const TabBtn = styled.button`
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => (props.$active ? theme.black : theme.gray)};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: ${theme.dark};
  }

  ${props => props.$active && `
    border-bottom-color: ${theme.black};
    color: ${theme.black};
  `}
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid ${theme.borderLight};
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${theme.borderLight};
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${theme.black};
  margin: 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${theme.mid};
`;

const Input = styled.input`
  width: 100%;
  height: 42px;
  border: 1px solid ${theme.border};
  border-radius: 8px;
  padding: 0 1rem;
  font-size: 0.95rem;
  font-family: inherit;
  color: ${theme.dark};
  background: ${theme.bgField};
  transition: all 0.2s ease;

  &::placeholder {
    color: ${theme.lightGray};
  }

  &:focus {
    outline: none;
    border-color: ${theme.black};
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.05);
  }

  &:disabled {
    background: #f1f1f1;
    color: ${theme.gray};
    cursor: not-allowed;
  }
`;

// FIXED: The SVG data URI with double quotes caused "Indexed property setter is not supported"
// in styled-components v6. Using single-quoted SVG and encoded chars avoids CSS parsing issues.
const Select = styled.select`
  width: 100%;
  height: 42px;
  border: 1px solid ${theme.border};
  border-radius: 8px;
  padding: 0 1rem;
  font-size: 0.95rem;
  font-family: inherit;
  color: ${theme.dark};
  background: ${theme.bgField};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2212%22 height%3D%2212%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%23777%22 stroke-width%3D%222%22%3E%3Cpolyline points%3D%226 9 12 15 18 9%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 1rem center;

  &:focus {
    outline: none;
    border-color: ${theme.black};
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.05);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid ${theme.border};
  background: #ffffff;
  color: ${theme.dark};

  &:hover {
    border-color: ${theme.black};
    background: ${theme.bgField};
  }

  ${props => props.$primary && `
    background: ${theme.black};
    color: #ffffff;
    border-color: ${theme.black};
    
    &:hover {
      background: ${theme.dark};
      border-color: ${theme.dark};
    }
  `}

  ${props => props.$disabled && `
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${theme.gray};
    padding: 0.75rem 1rem;
    border-bottom: 1px solid ${theme.borderLight};
    font-weight: 600;
  }
  
  td {
    padding: 1rem;
    font-size: 0.9rem;
    border-bottom: 1px solid ${theme.borderLight};
    color: ${theme.dark};
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
  
  tbody tr:hover {
    background: ${theme.bgField};
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => (props.$active ? '#d1fae5' : '#f1f5f9')};
  color: ${props => (props.$active ? '#059669' : '#64748b')};
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
  background: #eef2ff;
  color: #4f46e5;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background: ${theme.bgField};
  border: 1px dashed ${theme.border};
  border-radius: 8px;
  color: ${theme.gray};
  
  h4 {
    color: ${theme.dark};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

const ErrorText = styled.span`
  color: ${theme.red};
  font-size: 0.8rem;
  font-weight: 500;
`;

// ============================================================
// ROLES (from users table ENUM)
// ============================================================
const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'hr', label: 'HR' },
  { value: 'mortician', label: 'Mortician' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'workshop_manager', label: 'Workshop Manager' },
  { value: 'technician', label: 'Technician' },
  { value: 'driver', label: 'Driver' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

const SettingsPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { tenantData, setTenantData } = useTenantStore();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);

  const [settings, setSettings] = useState({
    tenantName: '',
    tenantSlug: '',
    email: '',
    phone: '',
    location: '',
    country: '',
    deploymentType: 'single',
    currency: 'KES',
    dailyRate: 1500,
    embalmingRate: 3000,
    storageRate: 500,
    taxRate: 0,
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff',
    branch_id: ''
  });
  const [newUserError, setNewUserError] = useState('');

  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'system_shared';

  useEffect(() => {
    loadSettings();
  }, [tenantSlug]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsResult = await tenantApi.getTenantSettings(tenantSlug);
      const settingsData = settingsResult?.data || settingsResult || {};

      const branchesResult = await tenantApi.getBranches(tenantSlug);
      const branchesData = branchesResult?.data || branchesResult || [];
      const branchList = Array.isArray(branchesData)
        ? branchesData
        : Array.isArray(branchesData?.branches) ? branchesData.branches : [];
      setBranches(branchList);

      const merged = {
        tenantName: settingsData.tenantName || tenantData?.name || tenantData?.tenantName || '',
        tenantSlug: settingsData.tenantSlug || tenantSlug,
        email: settingsData.email || tenantData?.email || '',
        phone: settingsData.phone || tenantData?.phone || '',
        location: settingsData.location || tenantData?.location || '',
        country: settingsData.country || tenantData?.country || '',
        deploymentType: settingsData.deploymentType || tenantData?.deploymentType || 'single',
        currency: settingsData.currency || 'KES',
        dailyRate: settingsData.dailyRate || 1500,
        embalmingRate: settingsData.embalmingRate || 3000,
        storageRate: settingsData.storageRate || 500,
        taxRate: settingsData.taxRate || 0,
      };

      setSettings(merged);

      // Load real users from API
      await loadUsers();
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await tenantApi.getUsers(tenantSlug);
      if (result?.success && Array.isArray(result.users)) {
        setUsers(result.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      setTenantData({
        ...tenantData,
        name: settings.tenantName,
        tenantName: settings.tenantName,
        email: settings.email,
        phone: settings.phone,
        location: settings.location,
        country: settings.country,
        deploymentType: settings.deploymentType,
      });
      localStorage.setItem('deploymentType', settings.deploymentType);
      showToast.success('Settings saved successfully');
    } catch (error) {
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBilling = async () => {
    setSaving(true);
    try {
      await tenantApi.updateTenantSettings(tenantSlug, {
        currency: settings.currency,
        dailyRate: settings.dailyRate,
        embalmingRate: settings.embalmingRate,
        storageRate: settings.storageRate,
        taxRate: settings.taxRate,
      });
      showToast.success('Billing settings saved successfully');
    } catch (error) {
      showToast.error('Failed to save billing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    // Validate required fields
    if (!newUser.full_name.trim()) {
      setNewUserError('Full name is required');
      return;
    }
    if (!newUser.username.trim()) {
      setNewUserError('Username is required');
      return;
    }
    if (!newUser.email.trim()) {
      setNewUserError('Email is required');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      setNewUserError('Password must be at least 6 characters');
      return;
    }
    if (!newUser.role) {
      setNewUserError('Please select a role');
      return;
    }
    if (!newUser.branch_id) {
      setNewUserError('Please select a branch');
      return;
    }

    setNewUserError('');
    setCreatingUser(true);

    try {
      const result = await tenantApi.createUser({
        email: newUser.email.trim(),
        password: newUser.password,
        full_name: newUser.full_name.trim(),
        username: newUser.username.trim(),
        role: newUser.role,
        branch_id: parseInt(newUser.branch_id),
      });

      if (result?.success) {
        showToast.success('User created successfully!');
        // Reset form
        setNewUser({
          full_name: '',
          username: '',
          email: '',
          password: '',
          role: 'staff',
          branch_id: ''
        });
        // Refresh users list
        await loadUsers();
      } else {
        setNewUserError(result?.message || 'Failed to create user');
        showToast.error(result?.message || 'Failed to create user');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create user';
      setNewUserError(msg);
      showToast.error(msg);
    } finally {
      setCreatingUser(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '5rem 0', color: theme.gray }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${theme.borderLight}`, borderTop: `3px solid ${theme.black}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading settings...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ContentContainer>
        <HeaderContainer>
          <Title>System Settings</Title>
          <Subtitle>Manage your organization details, branches, billing, and user access.</Subtitle>
        </HeaderContainer>

        <TabNav>
          <TabBtn $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>General</TabBtn>
          <TabBtn $active={activeTab === 'branches'} onClick={() => setActiveTab('branches')}>Branches</TabBtn>
          <TabBtn $active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>Billing</TabBtn>
          <TabBtn $active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</TabBtn>
        </TabNav>

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>

            <FormGrid>
              <FormGroup>
                <Label>Organization Name</Label>
                <Input
                  value={settings.tenantName}
                  onChange={(e) => setSettings({ ...settings, tenantName: e.target.value })}
                  placeholder="Enter organization name"
                />
              </FormGroup>
              <FormGroup>
                <Label>Tenant Slug</Label>
                <Input value={settings.tenantSlug} disabled />
              </FormGroup>
            </FormGrid>

            <FormGrid>
              <FormGroup>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="info@organization.com"
                />
              </FormGroup>
              <FormGroup>
                <Label>Phone Number</Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </FormGroup>
            </FormGrid>

            <FormGrid>
              <FormGroup>
                <Label>Location</Label>
                <Input
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  placeholder="City, Street"
                />
              </FormGroup>
              <FormGroup>
                <Label>Country</Label>
                <Input
                  value={settings.country}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                  placeholder="Country"
                />
              </FormGroup>
              <FormGroup>
                <Label>Deployment Type</Label>
                <Select
                  value={settings.deploymentType}
                  onChange={(e) => setSettings({ ...settings, deploymentType: e.target.value })}
                >
                  <option value="single">Single Branch</option>
                  <option value="multi">Multi Branch</option>
                </Select>
              </FormGroup>
            </FormGrid>

            <ActionRow>
              <Button $primary onClick={handleSaveGeneral} $disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ActionRow>
          </Card>
        )}

        {/* BRANCHES TAB */}
        {activeTab === 'branches' && (
          <Card>
            <CardHeader>
              <CardTitle>Registered Branches</CardTitle>
              <Button onClick={() => setActiveTab('branches')}>
                Manage Branches
              </Button>
            </CardHeader>

            {branches.length === 0 ? (
              <EmptyState>
                <h4>No branches found</h4>
                <p>Branches will appear here once configured for your organization.</p>
              </EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Contact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch, i) => (
                    <tr key={branch.branch_id || i}>
                      <td style={{ fontWeight: 600 }}>{branch.branch_name || branch.name || branch_name || '—'}</td>
                      <td>{branch.branch_location || branch.location || '—'}</td>
                      <td>{branch.branch_phone || branch.contact_phone || '—'}</td>
                      <td>
                        <Badge $active={branch.is_active !== false}>
                          {branch.is_active === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Configuration</CardTitle>
            </CardHeader>

            <FormGrid>
              <FormGroup>
                <Label>Currency</Label>
                <Select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                >
                  <option value="KES">KES - Kenyan Shilling (Ksh)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Daily Rate ({settings.currency === 'KES' ? 'Ksh' : '$'})</Label>
                <Input
                  type="number"
                  value={settings.dailyRate}
                  onChange={(e) => setSettings({ ...settings, dailyRate: parseFloat(e.target.value) || 0 })}
                />
              </FormGroup>
            </FormGrid>

            <FormGrid>
              <FormGroup>
                <Label>Embalming Rate ({settings.currency === 'KES' ? 'Ksh' : '$'})</Label>
                <Input
                  type="number"
                  value={settings.embalmingRate}
                  onChange={(e) => setSettings({ ...settings, embalmingRate: parseFloat(e.target.value) || 0 })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Storage Rate ({settings.currency === 'KES' ? 'Ksh' : '$'})</Label>
                <Input
                  type="number"
                  value={settings.storageRate}
                  onChange={(e) => setSettings({ ...settings, storageRate: parseFloat(e.target.value) || 0 })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </FormGroup>
            </FormGrid>

            <ActionRow>
              <Button $primary onClick={handleSaveBilling} $disabled={saving}>
                {saving ? 'Saving...' : 'Save Billing Settings'}
              </Button>
            </ActionRow>
          </Card>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            {/* Create User Card */}
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>

              {newUserError && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem' }}>
                  <ErrorText>{newUserError}</ErrorText>
                </div>
              )}

              <FormGrid>
                <FormGroup>
                  <Label>Full Name</Label>
                  <Input
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Username</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="e.g. johndoe"
                  />
                </FormGroup>
              </FormGrid>

              <FormGrid>
                <FormGroup>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@organization.com"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 6 characters"
                  />
                </FormGroup>
              </FormGrid>

              <FormGrid>
                <FormGroup>
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Assign to Branch</Label>
                  <Select
                    value={newUser.branch_id}
                    onChange={(e) => setNewUser({ ...newUser, branch_id: e.target.value })}
                  >
                    <option value="">Select a branch...</option>
                    {branches.map((branch) => (
                      <option
                        key={branch.branch_id || branch.id || branch.branch_name}
                        value={branch.branch_id || branch.id}
                      >
                        {branch.branch_name || branch.name || branch.branch_name || 'Branch'}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              </FormGrid>

              <ActionRow>
                <Button $primary onClick={handleCreateUser} $disabled={creatingUser}>
                  {creatingUser ? 'Creating...' : 'Create User'}
                </Button>
              </ActionRow>
            </Card>

            {/* Users List Card */}
            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
                {loadingUsers && <span style={{ fontSize: '0.8rem', color: theme.gray }}>Loading...</span>}
              </CardHeader>

              {!loadingUsers && users.length === 0 ? (
                <EmptyState>
                  <h4>No users found</h4>
                  <p>Create a user using the form above to get started.</p>
                </EmptyState>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userId || user.email}>
                        <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                        <td>{user.username || user.email}</td>
                        <td>{user.email}</td>
                        <td>
                          <RoleBadge>{user.role}</RoleBadge>
                        </td>
                        <td>{user.branchName || 'Unassigned'}</td>
                        <td>
                          <Badge $active={user.isActive !== false}>
                            {user.isActive === false ? 'Inactive' : 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </>
        )}
      </ContentContainer>
    </PageWrapper>
  );
};

export default SettingsPage;