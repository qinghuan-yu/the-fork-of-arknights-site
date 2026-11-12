import { useEffect, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Modal } from './Modal';
import { VideoPlayer } from './VideoPlayer';
import { ContentTransition } from './ContentTransition';
import { Icon } from './Icon';

export function TopicView({ title, topics, onReturn, active, visible }) {
  const [index, setIndex] = useState(topics.length - 1);
  const [video, setVideo] = useState(null);
  const portrait = useMediaQuery('(orientation: portrait)');
  const topic = topics[index].content;
  useEffect(() => { if (!active) setVideo(null); }, [active]);
  return <div className={`topic-container ${visible ? 'topic-active' : ''}`} inert={!visible} data-scrollable>
    <ContentTransition state={index}><div className="topic-bgWrapper"><div className="topic-bg" style={{ backgroundImage: `url(${portrait ? topic.coverPortrait.url : topic.cover.url})` }} /></div></ContentTransition>
    <div className="topic-bgMask" /><div className="topic-tabList"><div className="topic-_tabList">{topics.map((entry, i) => <button type="button" key={entry.cid} className={`topic-tabItem ${index === i ? 'topic-active' : ''}`} aria-pressed={index === i} onClick={() => setIndex(i)}><span className="topic-text">{entry.content.title}</span><span className="topic-icon"><Icon name="icon_arrow" /></span></button>)}</div></div>
    {!portrait && <div className="topic-floatingText">{title}</div>}
    <ContentTransition state={index} direction="horizontal"><div className="topic-topicInfo"><div className="topic-subtitle">{topic.subtitle}</div><h2 className="topic-title">{topic.title}</h2><div className="topic-titleLine" />
      <div className="topic-actions">{topic.buttons.map((button, i) => <button type="button" key={i} className="topic-action" aria-haspopup="dialog" onClick={() => setVideo(button.primaryText)}>
        <span className="topic-flag" style={{ backgroundColor: button.themeColor }} /><span className="topic-subText">{button.subText}</span><span className="topic-primaryText">{button.primaryText}</span><span className="topic-icon"><Icon name="icon_mini_play_btn" /></span>
      </button>)}</div><div className="topic-actionsLine" />
    </div></ContentTransition>
    <div className="topic-navContainer">{topics.map((entry, i) => <button type="button" className={`topic-navItem ${index === i ? 'topic-active' : ''}`} key={entry.cid} aria-label={`切换至${entry.content.title}`} aria-pressed={index === i} onClick={() => setIndex(i)} />)}</div>
    <div className="topic-buttons"><button type="button" className="topic-button topic-returnBtn" onClick={onReturn}><span className="topic-icon"><Icon name="icon_arrow_hrz" /></span><span className="topic-btnText"><span className="topic-main">返回</span><span className="topic-sub">GO BACK</span></span></button></div><div className="topic-coordMark" />
    {video && active && <Modal title={`${topic.title} · ${video}`} onClose={() => setVideo(null)}><VideoPlayer /></Modal>}
  </div>;
}
