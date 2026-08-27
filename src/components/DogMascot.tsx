import eatDog from '../assets/dogs/eat.svg';
import happyDog from '../assets/dogs/happy.svg';
import pointDog from '../assets/dogs/point.svg';
import restDog from '../assets/dogs/rest.svg';
import signDog from '../assets/dogs/sign.svg';
import spinDog from '../assets/dogs/spin.svg';
import thinkDog from '../assets/dogs/think.svg';
import walkDog from '../assets/dogs/walk.svg';

export type DogState =
  | 'rest'
  | 'happy'
  | 'think'
  | 'spin'
  | 'point'
  | 'sign'
  | 'eat'
  | 'walk';

const dogSources: Record<DogState, string> = {
  rest: restDog,
  happy: happyDog,
  think: thinkDog,
  spin: spinDog,
  point: pointDog,
  sign: signDog,
  eat: eatDog,
  walk: walkDog,
};

interface DogMascotProps {
  state: DogState;
  alt?: string;
  className?: string;
}

export function DogMascot({ state, alt = '原创线稿小狗', className = '' }: DogMascotProps) {
  return <img className={`dog-mascot ${className}`} src={dogSources[state]} alt={alt} />;
}
