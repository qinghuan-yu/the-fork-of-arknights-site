import { useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { BackButton } from './BackButton';
import { Modal } from './Modal';
import { VideoPlayer } from './VideoPlayer';
import '../styles/topic.css';

export function TopicView({ title, topics, onReturn, active }) {
  const [index, setIndex] = useState(topics.length - 1);
  const [video, setVideo] = useState(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  const topic = topics[index].content;
  return <div className="topic-container topic-active" data-scrollable>
    <div className="topic-bgWrapper"><div className="topic-bg content-enter" key={index} style={{ backgroundImage: `url(${portrait ? topic.coverPortrait.url : topic.cover.url})` }} /></div>
    <div className="topic-bgMask" /><div className="topic-tabList"><div className="topic-_tabList">{topics.map((entry, i) => <button type="button" key={entry.cid} className={`topic-tabItem ${index === i ? 'topic-active' : ''}`} aria-pressed={index === i} onClick={() => setIndex(i)}><span className="topic-text">{entry.content.title}</span><span className="topic-icon">›</span></button>)}</div></div>
    <div className="topic-floatingText">{title}</div>
    <div className="topic-topicInfo content-enter" key={`info-${index}`}><div className="topic-subtitle">{topic.subtitle}</div><h2 className="topic-title">{topic.title}</h2><div className="topic-titleLine" />
      <div className="topic-actions">{topic.buttons.map((button, i) => <button type="button" key={i} className="topic-action" aria-haspopup="dialog" onClick={() => setVideo(button.primaryText)}>
        <span className="topic-flag" style={{ backgroundColor: button.themeColor }} /><span className="topic-subText">{button.subText}</span><span className="topic-primaryText">{button.primaryText}</span><span className="topic-icon">▷</span>
      </button>)}</div><div className="topic-actionsLine" />
    </div>
    <div className="topic-navContainer">{topics.map((entry, i) => <button type="button" className={`topic-navItem ${index === i ? 'topic-active' : ''}`} key={entry.cid} aria-label={`切换至${entry.content.title}`} aria-pressed={index === i} onClick={() => setIndex(i)} />)}</div>
    <BackButton className="topic-back" onClick={onReturn} />
    {video && active && <Modal title={video} onClose={() => setVideo(null)}><VideoPlayer /><h2 className="player-title">{topic.title} · {video}</h2></Modal>}
  </div>;
}
