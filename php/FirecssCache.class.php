<?php
#  FireCSS - See CSS changes in all browsers as you edit
#  Copyright (C) 2011  Julian Cox, Webspeed Ltd.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Manage cache for FireCSS
 * @author  Simon Leblanc <contact@leblanc-simon.eu>
 * @license http://www.gnu.org/licenses/ GNU GPL
 * @version 0.1
 * @package FireCSS
 */
class FirecssCache
{
  /**
   * @var     string    The cache directory
   * @access  private
   * @static
   * @since   0.1
   */
  private static $cache_directory = null;
  
  /**
   * @var     string    The cache file path
   * @access  private
   * @static
   * @since   0.1
   */
  private static $cache_filename = null;
  
  
  /**
   * Save the datas in the cache file
   *
   * @param   array           $datas    The datas to save
   * @param   IFirecssSession $session  The firecss session
   * @return  bool                      True if it's OK, false else
   * @access  public
   * @static
   * @since   0.1
   */
  public static function setCache($datas, IFirecssSession $session)
  {
    FirecssCache::init($session);
    
    $datas_str = '<?php $datas = '.var_export($datas, true).';';
    
    if (file_put_contents(FirecssCache::$cache_filename, $datas_str) !== false) {
      return true;
    } else {
      return false;
    }
  }
  
  
  /**
   * Get the datas in the cache file
   *
   * @param   IFirecssSession $session  The firecss session
   * @return  array                     The datas saved for the session
   * @access  public
   * @static
   * @since   0.1
   */
  public static function getCache(IFirecssSession $session)
  {
    FirecssCache::init($session);
    
    if (file_exists(FirecssCache::$cache_filename) === true) {
      ob_start();
      require FirecssCache::$cache_filename;
      ob_end_clean();
    } else {
      $datas = array();
    }
    
    return $datas;
  }
  
  
  /**
   * Initialize the cache directory and filename
   *
   * @param   IFirecssSession $session  The firecss session
   * @return  void
   * @access  private
   * @static
   * @since   0.1
   */
  private static function init(IFirecssSession $session)
  {
    if (FirecssCache::$cache_filename !== null) {
      return;
    }
    
    // Check if cache directory is defined
    if (FirecssCache::$cache_directory === null) {
      $directory = dirname(__FILE__).DIRECTORY_SEPARATOR.'cache';
      if (file_exists($directory) === false || is_dir($directory) === false) {
        // if the default cache directory doesn't exists : create it
        if (mkdir($directory, 0777) === true) {
          // and put an .htaccess
          file_put_contents($directory.DIRECTORY_SEPARATOR.'.htaccess', 'deny from all');
        } else {
          throw new Exception('Impossible to create cache directory');
        }
      }
      
      FirecssCache::initDirectory($directory);
    }
    
    FirecssCache::$cache_filename = FirecssCache::$cache_directory.DIRECTORY_SEPARATOR.$session->getId();
  }
  
  
  /**
   * Initialize the cache directory and filename
   *
   * @param   string    $directory  The cache directory
   * @return  void
   * @access  public
   * @static
   * @since   0.1
   */
  public static function initDirectory($directory)
  {
    if (file_exists($directory) === true && is_dir($directory) === true) {
      FirecssCache::$cache_directory = $directory;
    } else {
      throw new Exception('The directory doesn\'t exists');
    }
  }
}