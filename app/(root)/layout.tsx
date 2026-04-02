const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <main>{children}</main>
    </div>
  );
};

export default Layout;
