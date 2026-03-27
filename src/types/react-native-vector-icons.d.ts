declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class MaterialIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class Feather extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class FontAwesome extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class Ionicons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Entypo' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export default class Entypo extends Component<IconProps> {}
}
