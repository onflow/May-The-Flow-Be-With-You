'use client';

import { useState, useCallback } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Button, 
  ButtonGroup, 
  Tab, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Tabs,
  Flex,
  Text,
  Badge,
  Icon,
  useColorModeValue,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  FormControl,
  FormLabel,
  Switch
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiZap, FiSettings, FiPlay, FiPause, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamic imports para evitar SSR issues
const CreatureCanvas3D = dynamic(() => import('./CreatureCanvas3D'), { ssr: false });
const CreatureCanvasAdvanced = dynamic(() => import('./CreatureCanvasAdvanced'), { ssr: false });
const CreatureCanvas = dynamic(() => import('./CreatureCanvas'), { ssr: false });

// Interfaces
interface CreatureUIDataFrontend {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  edadDiasCompletos: string; 
  lifespanTotalSimulatedDays: string; 
  puntosEvolucion: string; 
  genesVisibles: { [key: string]: string }; 
  initialSeed: number; 
  seedChangeCount: string; 
  estaViva: boolean;
  genesOcultos: { [key: string]: string };
}

interface CreatureVisualizerHubProps {
  creatures: CreatureUIDataFrontend[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

type ViewMode = 'classic' | 'advanced' | '3d';

const MotionBox = motion(Box);

export default function CreatureVisualizerHub({
  creatures,
  onRefresh,
  isLoading = false
}: CreatureVisualizerHubProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('advanced');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Visual settings per mode
  const [classicSettings, setClassicSettings] = useState({
    showTrails: true,
    showParticles: true,
    showGrid: false
  });
  
  const [advancedSettings, setAdvancedSettings] = useState({
    showTrails: true,
    showParticles: true,
    showGrid: false
  });
  
  const [threeDSettings, setThreeDSettings] = useState({
    enableInteraction: true,
    showEnvironment: true,
    cameraAutoRotate: false
  });

  // Theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const controlsBg = useColorModeValue('gray.50', 'gray.700');

  // Statistics
  const aliveCreatures = creatures.filter(c => c.estaViva);
  const totalEP = creatures.reduce((sum, c) => {
    const ep = parseFloat(c.puntosEvolucion || '0');
    return sum + (isNaN(ep) ? 0 : ep);
  }, 0);
  const avgAge = aliveCreatures.length > 0 
    ? aliveCreatures.reduce((sum, c) => {
        const age = parseFloat(c.edadDiasCompletos || '0');
        return sum + (isNaN(age) ? 0 : age);
      }, 0) / aliveCreatures.length
    : 0;

  // Handlers
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSizeChange = useCallback((dimension: 'width' | 'height', value: number) => {
    setCanvasSize(prev => ({ ...prev, [dimension]: value }));
  }, []);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Render controls
  const renderControls = () => (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      bg={controlsBg}
      p={4}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        {/* Main Controls */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <HStack>
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={handleRefresh}
              isLoading={isLoading}
              size="sm"
              colorScheme="blue"
            >
              Refresh
            </Button>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="auto-refresh" mb="0" fontSize="sm">
                Auto Refresh
              </FormLabel>
              <Switch
                id="auto-refresh"
                isChecked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="sm"
              />
            </FormControl>
          </HStack>
          
          <HStack>
            <Text fontSize="sm" color="gray.500">View Mode:</Text>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                onClick={() => handleViewModeChange('classic')}
                isActive={viewMode === 'classic'}
                leftIcon={<Icon as={FiEye} />}
              >
                Classic
              </Button>
              <Button
                onClick={() => handleViewModeChange('advanced')}
                isActive={viewMode === 'advanced'}
                leftIcon={<Icon as={FiZap} />}
              >
                Advanced
              </Button>
              <Button
                onClick={() => handleViewModeChange('3d')}
                isActive={viewMode === '3d'}
                leftIcon={<Icon as={FiSettings} />}
              >
                3D
              </Button>
            </ButtonGroup>
          </HStack>
        </Flex>

        {/* Canvas Size Controls */}
        <HStack spacing={6}>
          <FormControl>
            <FormLabel fontSize="sm">Width: {canvasSize.width}px</FormLabel>
            <Slider
              value={canvasSize.width}
              onChange={(value) => handleSizeChange('width', value)}
              min={400}
              max={1200}
              step={50}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Height: {canvasSize.height}px</FormLabel>
            <Slider
              value={canvasSize.height}
              onChange={(value) => handleSizeChange('height', value)}
              min={300}
              max={800}
              step={50}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Animation Speed: {animationSpeed}x</FormLabel>
            <Slider
              value={animationSpeed}
              onChange={setAnimationSpeed}
              min={0.1}
              max={3}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>
        </HStack>

        {/* Mode-specific settings */}
        {viewMode === 'classic' && (
          <HStack spacing={4}>
            <Text fontSize="sm" fontWeight="medium">Classic Settings:</Text>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Trails</FormLabel>
              <Switch
                isChecked={classicSettings.showTrails}
                onChange={(e) => setClassicSettings(prev => ({ ...prev, showTrails: e.target.checked }))}
                size="sm"
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Grid</FormLabel>
              <Switch
                isChecked={classicSettings.showGrid}
                onChange={(e) => setClassicSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                size="sm"
              />
            </FormControl>
          </HStack>
        )}

        {viewMode === 'advanced' && (
          <HStack spacing={4}>
            <Text fontSize="sm" fontWeight="medium">Advanced Settings:</Text>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Trails</FormLabel>
              <Switch
                isChecked={advancedSettings.showTrails}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, showTrails: e.target.checked }))}
                size="sm"
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Particles</FormLabel>
              <Switch
                isChecked={advancedSettings.showParticles}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, showParticles: e.target.checked }))}
                size="sm"
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Grid</FormLabel>
              <Switch
                isChecked={advancedSettings.showGrid}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                size="sm"
              />
            </FormControl>
          </HStack>
        )}

        {viewMode === '3d' && (
          <HStack spacing={4}>
            <Text fontSize="sm" fontWeight="medium">3D Settings:</Text>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Interaction</FormLabel>
              <Switch
                isChecked={threeDSettings.enableInteraction}
                onChange={(e) => setThreeDSettings(prev => ({ ...prev, enableInteraction: e.target.checked }))}
                size="sm"
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Environment</FormLabel>
              <Switch
                isChecked={threeDSettings.showEnvironment}
                onChange={(e) => setThreeDSettings(prev => ({ ...prev, showEnvironment: e.target.checked }))}
                size="sm"
              />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel fontSize="sm" mb="0">Auto Rotate</FormLabel>
              <Switch
                isChecked={threeDSettings.cameraAutoRotate}
                onChange={(e) => setThreeDSettings(prev => ({ ...prev, cameraAutoRotate: e.target.checked }))}
                size="sm"
              />
            </FormControl>
          </HStack>
        )}
      </VStack>
    </MotionBox>
  );

  // Render stats
  const renderStats = () => (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      bg={bgColor}
      p={4}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
    >
      <HStack justify="space-around" wrap="wrap" spacing={4}>
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Active Creatures
          </Text>
          <Badge colorScheme="green" fontSize="lg" px={3} py={1}>
            {aliveCreatures.length}
          </Badge>
        </VStack>
        
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Total Evolution Points
          </Text>
          <Badge colorScheme="purple" fontSize="lg" px={3} py={1}>
            {totalEP.toFixed(1)}
          </Badge>
        </VStack>
        
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            Average Age
          </Text>
          <Badge colorScheme="blue" fontSize="lg" px={3} py={1}>
            {avgAge.toFixed(1)} days
          </Badge>
        </VStack>
        
        <VStack spacing={1}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
            View Mode
          </Text>
          <Badge 
            colorScheme={viewMode === '3d' ? 'cyan' : viewMode === 'advanced' ? 'orange' : 'gray'} 
            fontSize="lg" 
            px={3} 
            py={1}
          >
            {viewMode.toUpperCase()}
          </Badge>
        </VStack>
      </HStack>
    </MotionBox>
  );

  // Render canvas
  const renderCanvas = () => (
    <AnimatePresence mode="wait">
      <MotionBox
        key={viewMode}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {viewMode === 'classic' && (
          <CreatureCanvas
            creatures={creatures}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
          />
        )}
        
        {viewMode === 'advanced' && (
          <CreatureCanvasAdvanced
            creatures={creatures}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            showTrails={advancedSettings.showTrails}
            showParticles={advancedSettings.showParticles}
            showGrid={advancedSettings.showGrid}
            animationSpeed={animationSpeed}
          />
        )}
        
        {viewMode === '3d' && (
          <CreatureCanvas3D
            creatures={creatures}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            enableInteraction={threeDSettings.enableInteraction}
          />
        )}
      </MotionBox>
    </AnimatePresence>
  );

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Header with toggle */}
      <Flex justify="space-between" align="center">
        <Text fontSize="2xl" fontWeight="bold">
          Creature Visualizer
        </Text>
        <Button
          leftIcon={<Icon as={showControls ? FiPause : FiPlay} />}
          onClick={() => setShowControls(!showControls)}
          size="sm"
          variant="ghost"
        >
          {showControls ? 'Hide' : 'Show'} Controls
        </Button>
      </Flex>

      {/* Stats */}
      {renderStats()}

      {/* Controls */}
      <AnimatePresence>
        {showControls && renderControls()}
      </AnimatePresence>

      {/* Main Canvas */}
      <Flex justify="center">
        {renderCanvas()}
      </Flex>
    </VStack>
  );
} 