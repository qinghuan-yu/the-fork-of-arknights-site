import { Icon } from './Icon';

export function BackButton({ onClick, className = '' }) {
  return <button type="button" className={`back-button ${className}`} onClick={onClick}>
    <Icon name="icon_arrow" reverse /><span>返回<small>GO BACK</small></span>
  </button>;
}
