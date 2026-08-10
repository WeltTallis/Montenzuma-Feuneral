const fs = require('fs');
const path = require('path');
const f = path.join('FrontendClient', 'client', 'src', 'components', 'releaseform', 'ReleaseFormPage.jsx');
let c = fs.readFileSync(f, 'utf8');

// Replace BrandLeft with BrandLeftWrapper
c = c.replace('const BrandLeft = styled.div`', 'const BrandLeftWrapper = styled.div`');

// Replace BrandRight with BrandRightWrapper  
c = c.replace('const BrandRight = styled.div`', 'const BrandRightWrapper = styled.div`');

// Replace FormBody padding
c = c.replace('const FormBody = styled.div`\n  padding: 4rem;', 'const FormBody = styled.div`\n  padding: 3rem 4rem;');

// Replace LogoBox styling
c = c.replace(/const LogoBox = styled.div`[\s\S]*?\`;/, `const LogoBox = styled.div`
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;`);

fs.writeFileSync(f, c);
console.log('Updates applied');
