'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product_image extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      Product_image.belongsTo(models.Products, {
        foreignKey: 'product_id',
        as: 'product'
      });      
    }
  }

  Product_image.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // nên yêu cầu bắt buộc
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false, // ảnh phải có URL
    },
  },
  {
    sequelize,
    modelName: 'Product_image',
    tableName: 'Product_image',
    timestamps: true,
  }
);


  return Product_image;
};
