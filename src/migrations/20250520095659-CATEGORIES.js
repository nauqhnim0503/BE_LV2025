'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('categories', {
       id:{
       type: Sequelize.INTEGER ,
       primaryKey:true,
       autoIncrement:true
       },
       name:{
        type:Sequelize.STRING,
        allowNull:true
       },
       image:{
        type:Sequelize.STRING,
        allowNull:true
       },
       createdAt:{
        type:Sequelize.DATE,
        allowNull:true
       },
       updatedAt:{
        type:Sequelize.DATE,
        allowNull:true
       }
      }
      )
      ;

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
