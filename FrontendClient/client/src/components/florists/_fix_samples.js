const fs = require('fs');
const path = 'FrontendClient/client/src/components/florists/Samples.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove story-add and story-love buttons from StoryItem
// The buttons are inside the ring div, after story-inner close div
const oldButtons = `        <button
          className={'story-add' + (isSelected ? ' is-added' : '')}
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          aria-label={isSelected ? 'Remove from booking' : 'Add to booking'}
        >
          {isSelected ? '\u2713' : '+'}
        </button>
        <button
          className={'story-love' + (isLiked ? ' is-liked' : '')}
          onClick={(e) => { e.stopPropagation(); onLike() }}
          aria-label="Love this arrangement"
        >
          <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5S4.9 16 3.2 11.6C2 8.6 3.7 5.5 6.8 5.5c2 0 3.6 1.2 4.4 2.9L12 10l.8-1.6c.8-1.7 2.4-2.9 4.4-2.9 3.1 0 4.8 3.1 3.6 6.1C19.1 16 12 20.5Z" /></svg>
        </button>
      </div>`;

const newButtons = `      </div>`;

if (content.includes(oldButtons)) {
  content = content.replace(oldButtons, newButtons);
  console.log('SUCCESS: buttons removed from StoryItem');
} else {
  console.log('FAILED: could not find buttons block');
  // Try to find a smaller piece
  console.log('story-add present:', content.includes('story-add'));
  console.log('story-love present:', content.includes('story-love'));
}

fs.writeFileSync(path, content, 'utf8');
console.log('File written');
