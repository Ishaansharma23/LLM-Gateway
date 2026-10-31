import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ onRefresh, isRefreshing }) {
  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onRefresh={onRefresh} isRefreshing={isRefreshing} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
