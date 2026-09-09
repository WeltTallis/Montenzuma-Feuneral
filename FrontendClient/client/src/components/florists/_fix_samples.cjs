const fs = require('fs');
const filePath = 'FrontendClient/client/src/components/florists/Samples.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('=== Part 1: Fix StoryItem, BrowseScreen, and add button ===');

// 1. Fix img indentation in StoryItem
const imgMatch = content.match(/(\s*)<img src=\{arrangement\.portrait \|\| arrangement\.img\} alt=\{arrangement\.name \|\| arrangement\.title\} \/>/);
if (imgMatch) {
  content = content.replace(imgMatch[0], '          <img src={arrangement.portrait || arrangement.img} alt={arrangement.name || arrangement.title} />');
  console.log('Fixed img indentation');
}

// 2. Fix StoryItem comment
content = content.replace(
  "// ── Story Item — tap to view · ＋ adds to booking · ♥ loves ───────────────────",
  "// ── Story Item — tap to view · single add button on left ───────────────────"
);

// 3. Update BrowseScreen function signature
content = content.replace(
  "function BrowseScreen({ selectedIds, onOpen, onAdd, onLike, likes = {}, likedIds = [], onPreview, arrangements = [], loading = false }) {",
  "function BrowseScreen({ selectedIds, onOpen, onAdd, onRemove, onPreview, arrangements = [], loading = false }) {"
);
console.log('Updated BrowseScreen signature');

// 4. Update StoryItem usage - remove love/add props
const storyItemUsageOld = `           <StoryItem
             key={a.id}
             arrangement={a}
             isActive={i === bgIdx}
             isSelected={selectedIds.includes(a.id)}
             isLiked={likedIds.includes(a.id)}
             likeCount={likes[a.id] ?? 0}
             size={72}
             animDelay={i * 0.18}
             onClick={() => onOpen(a.id)}
             onAdd={() => onAdd(a.id)}
             onLike={() => onLike(a.id)}
           />`;

const storyItemUsageNew = `           <StoryItem
             key={a.id}
             arrangement={a}
             isActive={i === bgIdx}
             isSelected={selectedIds.includes(a.id)}
             size={72}
             animDelay={i * 0.18}
             onClick={() => onOpen(a.id)}
           />`;

if (content.includes(storyItemUsageOld)) {
  content = content.replace(storyItemUsageOld, storyItemUsageNew);
  console.log('Updated StoryItem usage');
} else {
  console.log('NOTE: StoryItem usage not found with exact match, trying alternate...');
}

// 5. Add currentId after bg definition
content = content.replace(
  "  const bg = allArrangements[bgIdx] || allArrangements[0]",
  "  const bg = allArrangements[bgIdx] || allArrangements[0]\n  const currentId = bg?.id"
);
console.log('Added currentId variable');

// 6. Add add-float button before sel-float block
const selFloatOld = `      {!showPreview && selectedIds.length > 0 && (
        <div className="sel-float">`;

const selFloatNew = `      {!showPreview && allArrangements.length > 0 && (
        <div className="add-float">
          <button
            className={'add-float-btn' + (selectedIds.includes(currentId) ? ' is-added' : '')}
            onClick={() => onAdd(currentId)}
            aria-label={selectedIds.includes(currentId) ? 'Remove from booking' : 'Add to booking'}
          >
            <span className="add-icon">{selectedIds.includes(currentId) ? '✓' : '+'}</span>
            {selectedIds.includes(currentId) ? 'Added' : 'Add to Booking'}
          </button>
        </div>
      )}

      {!showPreview && selectedIds.length > 0 && (
        <div className="sel-float">`;

if (content.includes(selFloatOld)) {
  content = content.replace(selFloatOld, selFloatNew);
  console.log('Added add-float button');
} else {
  console.log('NOTE: sel-float block not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('=== Part 1 done ===');

