import { Icon } from './Icon';

export function BackButton({ onClick, className = '' }) {
  const group = className.split('-')[0];
  return <button type="button" className={`${group}-closeBtn`} onClick={onClick}>
    <span className={`${group}-icon`}><Icon name="icon_arrow" reverse /></span><span className={`${group}-btnText`}><span className={`${group}-main`}>返回</span><span className={`${group}-sub`}>GO BACK</span></span>
  </button>;
}
