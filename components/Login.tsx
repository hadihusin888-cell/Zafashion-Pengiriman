import React from 'react';

// Komponen ini tidak lagi digunakan karena autentikasi Firebase telah dihapus.
// Disimpan hanya sebagai placeholder jika struktur routing membutuhkannya di masa depan.
const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Login Dinonaktifkan</h1>
        <p className="text-gray-500">
          Aplikasi sekarang berjalan dalam mode Standalone/Offline dengan integrasi Google Sheets.
          Tidak diperlukan login.
        </p>
      </div>
    </div>
  );
};

export default Login;