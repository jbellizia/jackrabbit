import { Navigate } from "react-router-dom";

export default function PublicRoute({ isAuthenticated, children }) {
    if (isAuthenticated) {
        return <Navigate to="/admin" />;
    }
    return children;
}