BackboneThis
============
This app (backbonethis.com) is made for user to easily generate some basic JavaScript code for use with Backbone.js. 

The app takes an JSON input in the following form:

  {
      collectionName : {
          url: '/collection_url',
          model: {
              modelName : {
                  defaults: {
                      field_1 : "",
                      field_2 : "",
                      field_3 : "",
                  },
                  optionalMethod : function(e) {
                      return this.get('field_1');
                  },
                  urlRoot : '/collection_url'   // optional urlRoot
              }
          }
      } 
  }  
  
The input will be transformed into basic Backbone code for collections and models. There will also be two Backbone view components, two underscore templates, and a router for basic CRUD operations. These are based on Thomas Davis's Video Backbone Tutorial at https://www.youtube.com/watch?v=FZSjvWtUxYk 

You may test your code live on backbonethis.com, as it comes with a REST api backend written in PHP. All data on that server will be flushed frequently.
