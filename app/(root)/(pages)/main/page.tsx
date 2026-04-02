import { useUserStore } from "@/lib/store/useUserStore";

const page = () => {
  const { user, isLoading } = useUserStore();

  if (isLoading) return <div>Checking session...</div>;
  if (!user) return <div>User not logged in</div>;

  return <div>Welcome {user?.name}</div>;
};

export default page;
