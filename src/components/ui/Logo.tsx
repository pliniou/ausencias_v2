import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

// Central logos
import centralAmarelo from '@/assets/logos/BBTS-central-amarelo-institucional.png';
import centralAzul from '@/assets/logos/BBTS-central-azul-comercial.png';
import centralBranca from '@/assets/logos/BBTS-central-traco-branca.png';
import centralPreta from '@/assets/logos/BBTS-central-traco-preta.png';

// Horizontal logos
import horizontalAmarelo from '@/assets/logos/BBTS-horizontal-amarelo-institucional.png';
import horizontalAzul from '@/assets/logos/BBTS-horizontal-azul-comercial.png';
import horizontalBranca from '@/assets/logos/BBTS-horizontal-traco-branca.png';
import horizontalPreta from '@/assets/logos/BBTS-horizontal-traco-preta.png';

// Full logos (BB_Tecnologia_e_Servicos)
import fullAmarelo from '@/assets/logos/BB_Tecnologia_e_Servicos-amarelo-institucional.png';
import fullAzul from '@/assets/logos/BB_Tecnologia_e_Servicos-azul-comercial.png';
import fullBranca from '@/assets/logos/BB_Tecnologia_e_Servicos-traco-branca.png';
import fullPreta from '@/assets/logos/BB_Tecnologia_e_Servicos-traco-preta.png';

const logos = {
    central: {
        amarelo: centralAmarelo,
        azul: centralAzul,
        branca: centralBranca,
        preta: centralPreta,
    },
    horizontal: {
        amarelo: horizontalAmarelo,
        azul: horizontalAzul,
        branca: horizontalBranca,
        preta: horizontalPreta,
    },
    full: {
        amarelo: fullAmarelo,
        azul: fullAzul,
        branca: fullBranca,
        preta: fullPreta,
    },
};

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    variant?: 'central' | 'horizontal' | 'full';
    color?: 'amarelo' | 'azul' | 'branca' | 'preta' | 'auto';
}

export function Logo({ variant = 'central', color = 'auto', className, ...props }: LogoProps) {
    const { theme } = useTheme();

    let finalColor: 'amarelo' | 'azul' | 'branca' | 'preta';

    if (color === 'auto') {
        finalColor = theme === 'dark' ? 'branca' : 'azul';
    } else {
        finalColor = color;
    }

    const src = logos[variant][finalColor];

    return (
        <img
            src={src}
            alt={`Logo BBTS ${variant} ${finalColor}`}
            className={cn('object-contain', className)}
            {...props}
        />
    );
}
