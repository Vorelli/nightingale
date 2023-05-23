import MainPlayer from './MainPlayer';
import {useSelector} from 'react-redux';
import { RootState } from '../redux/store';
import AppDock from './AppDock.js';

type Props = {}
const windowComponents = {
  'music': < MainPlayer />,
//  'files': < />,
//  'info': < />,
//  'projects': < />,
//  'resume': < />
};

function WindowManager({}: Props) {
  const windows = useSelector((s: RootState) => s.windows);
  return [
    <div className='activeWindows'>
      {
        Object.keys(windows).filter((key: string) => !windows[key].hidden).map((key: string) => windowComponents[key])
      } 
    </div>,
    (<AppDock windows={windows} />)
  ] 
}

export default WindowManager
