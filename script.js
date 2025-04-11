// Fixed script.js
// Initialize renderer first so we can handle any WebGL errors early
const canvas = document.getElementById('earthCanvas');
let renderer;

try {
  // Create renderer with better error handling
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true 
  });
  
  // Enable shadow mapping
  renderer.shadowMap.enabled = true;
  
  // Set pixel ratio for better quality on high-DPI displays
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Initialize scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 1.8;
  let currentZoom = 1.8;

  // Add zoom controls
  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';
  
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'zoom-btn';
  zoomInBtn.textContent = '+';
  zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.max(0.5, currentZoom - 0.3);
    camera.position.z = currentZoom;
  });

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'zoom-btn';
  zoomOutBtn.textContent = '-';
  zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.min(3, currentZoom + 0.3);
    camera.position.z = currentZoom;
  });

  zoomControls.appendChild(zoomInBtn);
  zoomControls.appendChild(zoomOutBtn);
  document.querySelector('.earth-display').appendChild(zoomControls);
  
  // Create Earth geometry with good detail
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  
  // Create better material with some light reflection
  const material = new THREE.MeshStandardMaterial({
    map: null,  // Will be set when texture loads
    shininess: 10,
    metalness: 0.1, // Lower value for less metallic look
    roughness: 0.5, // Medium roughness
    emissive: 0x111111, // Slight self-illumination
    emissiveIntensity: 0.1
  });
    
  
  const earth = new THREE.Mesh(geometry, material);
  earth.castShadow = true;
  earth.receiveShadow = true;
  scene.add(earth);
  
  // Add proper lighting setup
  // Ambient light to ensure the dark side isn't completely black
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient light
  scene.add(ambientLight);

  // Main light source (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 3, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Add a subtle point light for better highlights
  const pointLight = new THREE.PointLight(0xffffff, 0.3);
  pointLight.position.set(-5, 3, 0);
  scene.add(pointLight);
  
  // Set up responsive rendering
  function resizeRenderer() {
    // We want to maintain our aspect ratio and size
    const size = Math.min(400, window.innerWidth * 0.8);
    renderer.setSize(size, size);
    // Update camera aspect if needed
    camera.aspect = 1; // Keep it as 1:1 ratio for a perfect circle
    camera.updateProjectionMatrix();
  }
  
  // Initial resize and add resize listener
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);
  
  // Better texture loading with error handling
  const textureLoader = new THREE.TextureLoader();
  
  function loadTexture(url) {
    // Show loading state
    earth.material.color.set(0x333333);
    
    textureLoader.load(
      url,
      function(texture) {
        // Success
        earth.material.map = texture;
        earth.material.needsUpdate = true;
      },
      function(xhr) {
        // Progress - could add a loading indicator here
      },
      function(error) {
        // Error handler
        console.error("Error loading texture:", error);
        earth.material.color.set(0x3366cc); // Fallback blue color
        earth.material.needsUpdate = true;
      }
    );
  }
  
  // Map of era textures
  const eraTextures = {
    modern: 'textures/earth_night.jpg',
    ancient: 'textures/earth old.jpg',
    prehistoric: 'dinoera.jpg',
    dinosaurs: 'textures/clouds.png',
    formation: 'textures/eartrh_bump.jpg'
  };
  
  // Load initial texture
  loadTexture(eraTextures.modern);
  
  // Mouse/touch controls variables
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationSpeed = 0.009;
  let momentumX = 0;
  let momentumY = 0;
  const momentumDecay = 0.01; // Looser decay
  const maxMomentum = 0.15; // Higher max momentum
  const sensitivity = 0.009; // Lower sensitivity

  // Event listeners for mouse/touch controls
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      momentumX = Math.min(maxMomentum, Math.max(-maxMomentum, deltaX * sensitivity));
      momentumY = Math.min(maxMomentum, Math.max(-maxMomentum, deltaY * sensitivity));
      earth.rotation.y += momentumX;
      earth.rotation.x += momentumY;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  // Touch event support
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  });

  canvas.addEventListener('touchmove', (e) => {
    if (isDragging) {
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;
      momentumX = Math.min(maxMomentum, Math.max(-maxMomentum, deltaX * sensitivity));
      momentumY = Math.min(maxMomentum, Math.max(-maxMomentum, deltaY * sensitivity));
      earth.rotation.y += momentumX;
      earth.rotation.x += momentumY;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      e.preventDefault();
    }
  });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    if (!isDragging) {
      // Apply momentum when not dragging
      earth.rotation.y += momentumX;
      earth.rotation.x += momentumY;
      // Decay momentum over time
      momentumX *= momentumDecay;
      momentumY *= momentumDecay;
      // Add auto-rotation when momentum is small
      if (Math.abs(momentumX) < 0.001 && Math.abs(momentumY) < 0.001) {
        earth.rotation.y += rotationSpeed;
      }
    }
    
    renderer.render(scene, camera);
  }
  
  // Start animation
  animate();
  
  // Era Selection Handler
  document.getElementById('eraSelector').addEventListener('change', (e) => {
    const selectedEra = e.target.value;
    if (eraTextures[selectedEra]) {
      loadTexture(eraTextures[selectedEra]);
    }
  });
  
} catch (error) {
  // WebGL error handling
  console.error("Three.js initialization error:", error);
  
  // Display error message to user
  const errorMessage = document.createElement('div');
  errorMessage.style.color = 'red';
  errorMessage.style.padding = '20px';
  errorMessage.innerHTML = `
    <p>Error loading 3D Earth: ${error.message}</p>
    <p>Try using a different browser or updating your graphics drivers.</p>
  `;
  
  // Replace canvas with error message
  if (canvas.parentNode) {
    canvas.parentNode.replaceChild(errorMessage, canvas);
  }
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();