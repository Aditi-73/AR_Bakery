import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';
import Modal from '../../components/ui/Modal/Modal';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setShowModal(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const orderHistory = [
    { id: 1, date: '2024-01-15', items: 'Artisan Bread (2)', total: '$9.98', status: 'Completed' },
    { id: 2, date: '2024-01-10', items: 'Custom Cake, French Pastry', total: '$35.48', status: 'Completed' },
    { id: 3, date: '2024-01-05', items: 'Assorted Pastries (6)', total: '$20.94', status: 'Completed' }
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account information and order history</p>
        </div>

        <div className="profile-content">
          {/* Profile Information */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing && (
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="edit-form">
                <Input
                  label="Display Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your display name"
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                />
                <div className="form-actions">
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <strong>Email:</strong>
                  <span>{user?.email}</span>
                </div>
                <div className="info-item">
                  <strong>Display Name:</strong>
                  <span>{user?.displayName || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <strong>Phone:</strong>
                  <span>{user?.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <strong>Address:</strong>
                  <span>{user?.address || 'Not provided'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="profile-section">
            <h2>Order History</h2>
            {orderHistory.length > 0 ? (
              <div className="order-history">
                {orderHistory.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <span className="order-date">{order.date}</span>
                      <span className={`order-status ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-details">
                      <span className="order-items">{order.items}</span>
                      <span className="order-total">{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-orders">No orders yet. Start shopping!</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Profile Updated"
      >
        <p>Your profile has been updated successfully!</p>
        <div className="modal-actions">
          <Button variant="primary" onClick={() => setShowModal(false)}>
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;