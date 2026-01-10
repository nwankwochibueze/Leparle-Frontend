// src/pages/profile/Profile.tsx
import { useAppSelector } from "../../store/hooks";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">First Name</label>
            <p className="font-medium">{user?.firstName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Last Name</label>
            <p className="font-medium">{user?.lastName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-2">Orders</h3>
          <p className="text-sm text-gray-600 mb-4">
            View and track your orders
          </p>
          <Link to="/orders" className="text-blue-600 hover:underline">
            View Orders →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-2">Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage your account settings
          </p>
          <Link to="/settings" className="text-blue-600 hover:underline">
            Go to Settings →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
