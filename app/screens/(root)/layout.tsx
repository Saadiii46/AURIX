import { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full">
      <main>{children}</main>
    </div>
  );
};
