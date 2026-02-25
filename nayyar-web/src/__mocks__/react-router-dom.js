const React = require('react');

const BrowserRouter = ({ children }) => React.createElement(React.Fragment, null, children);
const Routes = ({ children }) => React.createElement(React.Fragment, null, children);
const Route = () => null;
const Navigate = () => null;
const Link = ({ children }) => React.createElement(React.Fragment, null, children);
const useNavigate = () => () => {};
const useLocation = () => ({ pathname: '/', state: null });
const useParams = () => ({});

module.exports = {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
  useParams
};
