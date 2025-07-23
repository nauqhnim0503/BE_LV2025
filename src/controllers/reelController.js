// controllers/reelController.js
const { sequelize } = require('../models'); 
const { QueryTypes } = require('sequelize');
const path = require('path');

const uploadReel = async (req, res) => {
  try {
    const { title, product_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const video_url = req.file.path;
    const original_name = req.file.originalname;

    await sequelize.query(
      'INSERT INTO reels (product_id, video_url, title, original_name) VALUES (?, ?, ?, ?)',
      {
        replacements: [product_id, video_url, title, original_name],
        type: QueryTypes.INSERT,
      }
    );

    res.json({ message: 'Reel uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const getAllReels = async (req, res) => {
  try {
    const reels = await sequelize.query('SELECT * FROM reels ORDER BY created_at DESC', {
      type: QueryTypes.SELECT,
    });
    res.json(reels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const updateReel = async (req, res) => {
  try {
    const reelId = req.params.id;
    const { title, product_id } = req.body;

    if (req.file) {
      const video_url = req.file.path;
      const original_name = req.file.originalname;

      await sequelize.query(
        'UPDATE reels SET product_id = ?, video_url = ?, title = ?, original_name = ? WHERE id = ?',
        {
          replacements: [product_id, video_url, title, original_name, reelId],
          type: QueryTypes.UPDATE,
        }
      );
    } else {
      await sequelize.query(
        'UPDATE reels SET product_id = ?, title = ? WHERE id = ?',
        {
          replacements: [product_id, title, reelId],
          type: QueryTypes.UPDATE,
        }
      );
    }

    res.json({ message: 'Reel updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// Hàm xóa reel theo id
const deleteReel = async (req, res) => {
  try {
    const reelId = req.params.id;
    await sequelize.query('DELETE FROM reels WHERE id = ?', {
      replacements: [reelId],
      type: QueryTypes.DELETE,
    });
    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const getReelById = async (req, res) => {
  try {
    const reelId = req.params.id;
    const reels = await sequelize.query('SELECT * FROM reels WHERE id = ?', {
      replacements: [reelId],
      type: QueryTypes.SELECT,
    });

    if (reels.length === 0) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    res.json(reels[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
module.exports={
    uploadReel,
    getAllReels,
    updateReel,
    deleteReel,
    getReelById
}