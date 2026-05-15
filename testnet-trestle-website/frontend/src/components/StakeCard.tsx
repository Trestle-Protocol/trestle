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
      className="block p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all"
    >
      <h3 className={`font-semibold text-${color}-600 mb-2`}>{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </NavLink>
  );
}
