import Jimp from 'jimp';
import axios from 'axios';

export default async function handler(req, res) {
  console.log('API: Received request to /api/applyBanner');
  
  if (req.method !== 'POST') {
    console.log(`API: Rejected ${req.method} request`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken, profileImageUrl } = req.body;
  
  console.log('API: Request parameters:', { 
    hasAccessToken: !!accessToken,
    hasProfileImageUrl: !!profileImageUrl,
    profileImageUrlPrefix: profileImageUrl ? profileImageUrl.substring(0, 30) + '...' : null
  });
  
  if (!accessToken || !profileImageUrl) {
    console.error('API: Missing required parameters');
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('API: Attempting to read profile image...');
    // Get user's profile image
    const image = await Jimp.read(profileImageUrl);
    console.log('API: Successfully loaded image', { 
      width: image.getWidth(), 
      height: image.getHeight() 
    });
    
    // Create a green ring overlay
    const width = image.getWidth();
    const height = image.getHeight();
    const overlay = new Jimp(width, height);
    
    console.log('API: Creating overlay...');
    // Draw a green circle
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.9; // Slightly smaller to create a ring
    
    overlay.scan(0, 0, width, height, function(x, y, idx) {
      const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distanceFromCenter <= outerRadius && distanceFromCenter >= innerRadius) {
        // Create a gradient from light green to darker green
        const angle = Math.atan2(y - centerY, x - centerX);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0 to 1
        
        // Set green gradient colors
        const r = 0;
        const g = Math.floor(150 + normalizedAngle * 105); // 150-255 range for green
        const b = 0;
        const a = 200; // Semi-transparent
        
        this.bitmap.data[idx + 0] = r;
        this.bitmap.data[idx + 1] = g;
        this.bitmap.data[idx + 2] = b;
        this.bitmap.data[idx + 3] = a;
      } else {
        // Make all other pixels transparent
        this.bitmap.data[idx + 3] = 0;
      }
    });

    console.log('API: Compositing overlay...');
    // Composite the overlay on top of the profile image
    image.composite(overlay, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
    });

    console.log('API: Getting buffer...');
    // Get image as buffer
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    console.log('API: Successfully created buffer');
    
    // Upload to Twitter using Twitter API v2
    try {
      console.log('API: Attempting to upload to Twitter...');
      
      // Convert image to base64
      const base64Image = buffer.toString('base64');
      
      // Twitter API v2 endpoint for updating profile image
      const twitterResponse = await axios({
        method: 'POST',
        url: 'https://api.twitter.com/2/users/me',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          profile_image: `data:image/png;base64,${base64Image}`
        }
      });
      
      console.log('API: Twitter response:', twitterResponse.data);
    } catch (twitterError) {
      console.error('API: Error uploading to Twitter:', {
        message: twitterError.message,
        status: twitterError.response?.status,
        data: twitterError.response?.data,
        headers: twitterError.response?.headers
      });
      
      // If we get a 401 Unauthorized, the token might be expired
      if (twitterError.response?.status === 401) {
        return res.status(401).json({
          error: 'Unauthorized: Your Twitter session has expired. Please sign in again.',
          details: twitterError.response?.data
        });
      }
      
      // Continue even if upload fails - we'll still return the modified image
    }

    console.log('API: Returning modified image...');
    // Return the modified image
    res.status(200).json({ 
      image: 'data:image/png;base64,' + buffer.toString('base64'),
      success: true
    });
  } catch (error) {
    console.error('API: Error processing image:', { 
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error processing image', details: error.message });
  }
} 