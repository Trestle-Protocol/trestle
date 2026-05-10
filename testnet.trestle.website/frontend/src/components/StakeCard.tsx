import { NavLink } from "react-router-dom";

interface Props {
  title: string;
  description: string;
  to: string;
  color?: string;
}

export default function StakeCard({ title, description, to, color = "emerald" }: Props) {
  return (
    <NavLink
      to={to}
      className={`block p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow`}
    >
      <h3 className={`font-semibold text-${color}-600`}>{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </NavLink>
  );
}
