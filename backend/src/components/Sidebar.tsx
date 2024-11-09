// src/components/Sidebar.tsx
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Components, 
  Users, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-lg h-screen">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          <li>
            <Link to="/" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/components" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
              <Components className="h-5 w-5" />
              <span>Components</span>
            </Link>
          </li>
          <li>
            <Link to="/users" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
          </li>
          <li>
            <Link to="/settings" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}